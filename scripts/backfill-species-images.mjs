#!/usr/bin/env node
/**
 * Backfill every catalog species image into Supabase Storage via the
 * `resolve-species-image` edge function. Idempotent — safe to re-run as the
 * catalog grows (already-resolved species return a cache hit instantly).
 *
 * Sources (deduped): domestic_species table + dex-number-registry.ts + species-catalog.ts.
 *
 * Usage:  node scripts/backfill-species-images.mjs
 * Env (optional, sensible public defaults):
 *   SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, BACKFILL_CONCURRENCY
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://wiysesftlprovkpouvqu.supabase.co'
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_QLe0faP1klanHt3V_HFy1w_K8EDJmUD'
const FN_URL = `${SUPABASE_URL}/functions/v1/resolve-species-image`
const FN_DETAIL_URL = `${SUPABASE_URL}/functions/v1/resolve-species-detail`
const CONCURRENCY = Number(process.env.BACKFILL_CONCURRENCY ?? 6)

// iNat-style class names → WildKind kingdom keys (the function validates with these).
const KINGDOM_MAP = {
  mammalia: 'mammal', aves: 'bird', reptilia: 'reptile', amphibia: 'amphibian',
  actinopterygii: 'fish', insecta: 'insect', arachnida: 'arachnid', mollusca: 'mollusc',
  plantae: 'plant', fungi: 'fungi',
  mammal: 'mammal', bird: 'bird', reptile: 'reptile', amphibian: 'amphibian', fish: 'fish',
  insect: 'insect', arachnid: 'arachnid', mollusc: 'mollusc', plant: 'plant', tree: 'tree',
  flower: 'flower',
}
const normKingdom = (k) => (k ? KINGDOM_MAP[String(k).trim().toLowerCase()] ?? null : null)
const clean = (s) => (s ?? '').toString().trim()
const dedupeKey = (s) => `${clean(s.commonName).toLowerCase()}|${clean(s.scientificName).toLowerCase()}`

async function fromDomesticTable() {
  const url = `${SUPABASE_URL}/rest/v1/domestic_species?select=common_name,latin_name,kingdom,dex_number`
  const res = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
  if (!res.ok) throw new Error(`domestic_species REST ${res.status}`)
  const rows = await res.json()
  return rows.map((r) => ({
    commonName: clean(r.common_name),
    scientificName: clean(r.latin_name) || null,
    kingdom: normKingdom(r.kingdom),
    dexNum: clean(r.dex_number) || null,
    speciesId: clean(r.dex_number) || null,
    isDomestic: true,
  }))
}

function fromRegistry() {
  const src = fs.readFileSync(path.join(ROOT, 'features/species/dex-number-registry.ts'), 'utf8')
  const region = src.slice(src.indexOf('CURATED_ASSIGNMENTS'))
  const blocks = [
    ...region.matchAll(
      /\{\s*dexNumber:\s*(['"])(.*?)\1[\s\S]*?commonNames:\s*\[([^\]]*)\][\s\S]*?latinNames:\s*\[([^\]]*)\]/g,
    ),
  ]
  return blocks.map((m) => {
    const dex = m[2]
    const common = (m[3].match(/['"]([^'"]+)['"]/) || [])[1] || ''
    const latin = (m[4].match(/['"]([^'"]+)['"]/) || [])[1] || ''
    const isDomestic = /^D/i.test(dex)
    return { commonName: clean(common), scientificName: clean(latin) || null, kingdom: null, dexNum: dex, speciesId: dex, isDomestic }
  })
}

function fromCatalog() {
  const src = fs.readFileSync(path.join(ROOT, 'data/species-catalog.ts'), 'utf8')
  const region = src.slice(src.indexOf('SPECIES_CATALOG'))
  const blocks = [
    ...region.matchAll(
      /commonName:\s*(['"])(.*?)\1[\s\S]{0,400}?latinName:\s*(['"])(.*?)\3[\s\S]{0,400}?kingdom:\s*(['"])(.*?)\5/g,
    ),
  ]
  return blocks.map((m) => ({
    commonName: clean(m[2]),
    scientificName: clean(m[4]) || null,
    kingdom: normKingdom(m[6]),
    dexNum: null,
    speciesId: null,
    isDomestic: m[6] === 'mammal' && /dog|cat|corgi|breed/i.test(m[2]),
  }))
}

async function resolveOne(species, attempt = 1) {
  try {
    const res = await fetch(FN_URL, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(species),
    })
    const data = await res.json().catch(() => ({}))
    if (data?.uri) return { ok: true, source: data.source ?? 'unknown' }
    if (attempt < 2) return resolveOne(species, attempt + 1)
    return { ok: false, reason: data?.reason ?? `http_${res.status}` }
  } catch (e) {
    if (attempt < 2) return resolveOne(species, attempt + 1)
    return { ok: false, reason: String(e) }
  }
}

async function resolveDetailOne(species, attempt = 1) {
  try {
    const res = await fetch(FN_DETAIL_URL, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(species),
    })
    const data = await res.json().catch(() => ({}))
    if (data?.description || data?.taxonomy) return { ok: true }
    if (attempt < 2) return resolveDetailOne(species, attempt + 1)
    return { ok: false, reason: data?.reason ?? `http_${res.status}` }
  } catch (e) {
    if (attempt < 2) return resolveDetailOne(species, attempt + 1)
    return { ok: false, reason: String(e) }
  }
}

async function runPool(items, worker, concurrency) {
  let i = 0
  const runNext = async () => {
    while (i < items.length) {
      const idx = i++
      await worker(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runNext))
}

async function main() {
  console.log('Gathering species from domestic_species + registry + catalog…')
  const [domestic, registry, catalog] = [await fromDomesticTable(), fromRegistry(), fromCatalog()]

  const byKey = new Map()
  for (const list of [domestic, registry, catalog]) {
    for (const s of list) {
      if (!clean(s.commonName) && !clean(s.scientificName)) continue
      const k = dedupeKey(s)
      const existing = byKey.get(k)
      // Prefer the entry with the most identity info (kingdom + dex).
      if (!existing || (!existing.kingdom && s.kingdom) || (!existing.dexNum && s.dexNum)) byKey.set(k, { ...existing, ...s })
    }
  }
  const species = [...byKey.values()]
  console.log(`Total unique species: ${species.length} (domestic ${domestic.length}, registry ${registry.length}, catalog ${catalog.length})`)

  const bySource = {}
  const failures = []
  let detailOk = 0
  const detailFailures = []
  let done = 0

  await runPool(
    species,
    async (s) => {
      const [img, detail] = await Promise.all([resolveOne(s), resolveDetailOne(s)])
      done++
      if (img.ok) {
        bySource[img.source] = (bySource[img.source] ?? 0) + 1
      } else {
        failures.push({ name: s.commonName, reason: img.reason })
      }
      if (detail.ok) detailOk++
      else detailFailures.push({ name: s.commonName, reason: detail.reason })
      const tags = `${img.ok ? `img:${img.source}` : 'img:FAIL'}  ${detail.ok ? 'detail:ok' : 'detail:FAIL'}`
      console.log(`[${done}/${species.length}] ${s.commonName.padEnd(28)} ${tags}`)
    },
    CONCURRENCY,
  )

  console.log('\n──────── BACKFILL SUMMARY ────────')
  console.log(`Images stored:  ${species.length - failures.length}/${species.length}  by source: ${JSON.stringify(bySource)}`)
  console.log(`Details cached: ${detailOk}/${species.length}`)
  if (failures.length) {
    console.log(`\nImage failures (${failures.length}):`)
    for (const f of failures) console.log(`  - ${f.name} (${f.reason})`)
  }
  if (detailFailures.length) {
    console.log(`\nDetail failures (${detailFailures.length}):`)
    for (const f of detailFailures) console.log(`  - ${f.name} (${f.reason})`)
  }
}

main().catch((e) => {
  console.error('Backfill crashed:', e)
  process.exit(1)
})
