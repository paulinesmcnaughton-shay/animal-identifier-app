-- Alphabetical browse: normalized sort key that strips leading punctuation
-- ('Ilima, (Asian)...) so the first page is real A, not symbols.
alter table public.species
  add column if not exists sort_name text
  generated always as (lower(regexp_replace(common_name, '^[^a-zA-Z0-9]+', ''))) stored;
create index if not exists species_sort_name_idx on public.species (sort_name, id);

-- Comprehensive Safari/Zoo/Aquarium/Farm/Petting-zoo coverage over the full
-- occurrence catalog (tagged by taxonomy), replacing reliance on the tiny
-- 79-row hand-curated catalog_species table for Open Source browse.
alter table public.species add column if not exists collections text[] default '{}';
create index if not exists species_collections_idx on public.species using gin (collections);

update species set collections = array_append(collections, 'safari')
where taxonomy->>'genus' in (
  'Panthera','Acinonyx','Loxodonta','Giraffa','Equus','Ceratotherium','Diceros',
  'Hippopotamus','Syncerus','Connochaetes','Crocuta','Hyaena','Lycaon','Phacochoerus',
  'Aepyceros','Oryx','Alcelaphus','Tragelaphus','Kobus','Struthio','Papio','Suricata',
  'Crocodylus','Otocyon','Damaliscus','Redunca','Madoqua','Raphicerus'
) and not ('safari' = any(collections));

update species set collections = array_append(collections, 'zoo')
where (taxonomy->>'genus' in (
  'Ailuropoda','Ailurus','Ursus','Gorilla','Pan','Pongo','Phascolarctos','Bradypus',
  'Choloepus','Vicugna','Lama','Varanus','Python','Boa','Pavo','Antilocapra',
  'Macropus','Osphranter','Camelus','Cyclura'
) or taxonomy->>'family' in ('Spheniscidae','Felidae','Elephantidae')
   or 'safari' = any(collections))
and not ('zoo' = any(collections));

update species set collections = array_append(collections, 'aquarium')
where (kingdom = 'fish'
   or (kingdom = 'mollusc' and taxonomy->>'class' = 'Cephalopoda')
   or (kingdom = 'reptile' and taxonomy->>'family' in ('Cheloniidae','Dermochelyidae'))
   or (kingdom = 'mammal' and taxonomy->>'genus' in (
        'Delphinus','Tursiops','Orcinus','Balaenoptera','Megaptera','Physeter',
        'Phoca','Zalophus','Trichechus','Enhydra','Mirounga','Phocoena','Monodon'
      )))
and not ('aquarium' = any(collections));

update species set collections = array_append(collections, 'farm')
where taxonomy->>'genus' in ('Bos','Ovis','Capra','Sus','Equus','Gallus','Anas','Anser','Meleagris')
and not ('farm' = any(collections));

update species set collections = array_append(collections, 'petting_zoo')
where taxonomy->>'genus' in ('Capra','Ovis','Gallus','Anas','Vicugna','Lama','Oryctolagus')
and not ('petting_zoo' = any(collections));
