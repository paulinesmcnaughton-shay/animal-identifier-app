#!/usr/bin/env node
/**
 * Downloads Avatar Shuffle images into assets/images/avatars/ for full offline support.
 *
 * Usage: node scripts/download-shuffle-avatars.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '../assets/images/avatars')

const USER_AGENT = 'Wildr/1.0 (https://github.com/wildr-app; avatar-asset-download)'

/** id + Commons search query */
const AVATARS = [
  { id: 'dog-labrador', search: 'Yellow Labrador Retriever' },
  { id: 'dog-golden', search: 'Golden Retriever dog' },
  { id: 'dog-beagle', search: 'Beagle dog' },
  { id: 'dog-french-bulldog', search: 'French Bulldog' },
  { id: 'dog-husky', search: 'Siberian Husky' },
  { id: 'cat-tabby', search: 'Tabby cat' },
  { id: 'cat-maine-coon', search: 'Maine Coon cat' },
  { id: 'rabbit', search: 'European rabbit' },
  { id: 'horse', search: 'Horse portrait' },
  { id: 'cow', search: 'Holstein cow' },
  { id: 'sheep', search: 'Domestic sheep' },
  { id: 'pig', search: 'Domestic pig' },
  { id: 'goat', search: 'Domestic goat' },
  { id: 'chicken', search: 'Rhode Island Red chicken' },
  { id: 'duck', search: 'Mallard duck' },
  { id: 'parrot', search: 'Blue and yellow macaw' },
  { id: 'hamster', search: 'Syrian hamster' },
  { id: 'goldfish', search: 'Goldfish' },
  { id: 'monarch', search: 'Monarch butterfly Danaus plexippus' },
  { id: 'bumblebee', search: 'Bumblebee' },
  { id: 'deer', search: 'White-tailed deer' },
  { id: 'squirrel', search: 'Eastern gray squirrel' },
  { id: 'turtle', search: 'Box turtle' },
  { id: 'dolphin', search: 'Bottlenose dolphin' },
  { id: 'penguin', search: 'Emperor penguin' },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchCommonsImageUrl(search) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: search,
    gsrnamespace: '6',
    gsrlimit: '1',
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '640',
    format: 'json',
    origin: '*',
  })

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  const pages = data.query?.pages
  if (!pages) return null
  const page = Object.values(pages)[0]
  const info = page?.imageinfo?.[0]
  return info?.thumburl ?? info?.url ?? null
}

async function downloadImage(url, destPath, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
      redirect: 'follow',
    })
    if (res.status === 429) {
      await sleep(5000 * (attempt + 1))
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(destPath, buf)
    return buf.length
  }
  throw new Error('Rate limited')
}

await mkdir(OUT_DIR, { recursive: true })

let ok = 0
let fail = 0

for (const { id, search } of AVATARS) {
  const destPath = join(OUT_DIR, `${id}.jpg`)
  try {
    await sleep(2000)
    const imageUrl = await fetchCommonsImageUrl(search)
    if (!imageUrl) {
      console.error(`No result for ${id} (${search})`)
      fail += 1
      continue
    }
    const bytes = await downloadImage(imageUrl, destPath)
    console.log(`Saved ${id} (${Math.round(bytes / 1024)} KB)`)
    ok += 1
  } catch (err) {
    console.error(`Failed ${id}:`, err.message)
    fail += 1
  }
}

console.log(`\nDone. ${ok} saved, ${fail} failed → ${OUT_DIR}`)
process.exit(fail > 0 ? 1 : 0)
