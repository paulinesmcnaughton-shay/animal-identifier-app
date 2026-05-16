// Custom Wildr map style — nature-forward, desaturated terrain
// Based on the Mapbox Streets v8 + Terrain v2 vector sources.
// No transit lines, reduced labels, sage green land, slate blue water, warm gray roads.

export const WILDR_MAP_STYLE = {
  version: 8,
  name: 'Wildr',
  sprite: 'mapbox://sprites/mapbox/outdoors-v12',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
  sources: {
    streets: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
    terrain: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-terrain-v2',
    },
    dem: {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
    },
  },
  terrain: { source: 'dem', exaggeration: 1.1 },
  layers: [
    // ── Background ─────────────────────────────────────────────────────────────
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#EDE8DC' },
    },

    // ── Land cover ─────────────────────────────────────────────────────────────
    {
      id: 'landcover-crop',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['crop', 'farmland', 'grass'], true, false],
      paint: { 'fill-color': '#D0DAC2', 'fill-opacity': 0.9 },
    },
    {
      id: 'landcover-scrub',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['scrub', 'brush', 'heath'], true, false],
      paint: { 'fill-color': '#B8CCA8', 'fill-opacity': 0.9 },
    },
    {
      id: 'landcover-wood',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      paint: { 'fill-color': '#9EBA8A', 'fill-opacity': 0.9 },
    },
    {
      id: 'landcover-snow',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'snow'],
      paint: { 'fill-color': '#EEF2F0', 'fill-opacity': 0.8 },
    },

    // ── Land use ───────────────────────────────────────────────────────────────
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landuse',
      filter: ['match', ['get', 'class'], ['park', 'pitch', 'village_green', 'garden', 'national_park'], true, false],
      paint: { 'fill-color': '#C4D8B0', 'fill-opacity': 0.75 },
    },
    {
      id: 'landuse-cemetery',
      type: 'fill',
      source: 'streets',
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'cemetery'],
      paint: { 'fill-color': '#C8CFBE', 'fill-opacity': 0.7 },
    },

    // ── Contour lines ──────────────────────────────────────────────────────────
    {
      id: 'contour',
      type: 'line',
      source: 'terrain',
      'source-layer': 'contour',
      filter: ['!=', ['get', 'index'], 5],
      paint: { 'line-color': '#C0B89A', 'line-width': 0.4, 'line-opacity': 0.35 },
    },
    {
      id: 'contour-index',
      type: 'line',
      source: 'terrain',
      'source-layer': 'contour',
      filter: ['==', ['get', 'index'], 5],
      paint: { 'line-color': '#B0A882', 'line-width': 0.8, 'line-opacity': 0.5 },
    },

    // ── Water ──────────────────────────────────────────────────────────────────
    {
      id: 'water',
      type: 'fill',
      source: 'streets',
      'source-layer': 'water',
      paint: { 'fill-color': '#8AAABF', 'fill-opacity': 1 },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'streets',
      'source-layer': 'waterway',
      paint: { 'line-color': '#8AAABF', 'line-width': 1.2, 'line-opacity': 0.85 },
    },

    // ── Roads — no transit ─────────────────────────────────────────────────────
    {
      id: 'road-motorway-case',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#C4B890', 'line-width': 5, 'line-gap-width': 0 },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#D8CCB0', 'line-width': 3.5 },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['==', ['get', 'class'], 'primary'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#DDD4BC', 'line-width': 2.5 },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#E4DCC8', 'line-width': 1.8 },
    },
    {
      id: 'road-street',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['match', ['get', 'class'], ['street', 'street_limited', 'residential', 'service'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#EAE4D0', 'line-width': 1.2 },
    },
    {
      id: 'road-path',
      type: 'line',
      source: 'streets',
      'source-layer': 'road',
      filter: ['match', ['get', 'class'], ['path', 'pedestrian', 'footway', 'track', 'steps'], true, false],
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': '#C8BC98', 'line-width': 0.9, 'line-dasharray': [2, 2] },
    },

    // ── Admin boundaries ───────────────────────────────────────────────────────
    {
      id: 'admin-country',
      type: 'line',
      source: 'streets',
      'source-layer': 'admin',
      filter: ['==', ['get', 'admin_level'], 0],
      paint: { 'line-color': '#A89C80', 'line-width': 1.2 },
    },
    {
      id: 'admin-state',
      type: 'line',
      source: 'streets',
      'source-layer': 'admin',
      filter: ['==', ['get', 'admin_level'], 1],
      paint: { 'line-color': '#B8AC90', 'line-width': 0.8, 'line-dasharray': [3, 2] },
    },

    // ── Labels — minimal ───────────────────────────────────────────────────────
    {
      id: 'label-waterway',
      type: 'symbol',
      source: 'streets',
      'source-layer': 'waterway_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Italic', 'Arial Unicode MS Regular'],
        'text-size': 11,
        'symbol-placement': 'line',
        'text-max-angle': 30,
      },
      paint: {
        'text-color': '#5A7888',
        'text-halo-color': '#EDE8DC',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'label-water',
      type: 'symbol',
      source: 'streets',
      'source-layer': 'water_label',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Italic', 'Arial Unicode MS Regular'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#4A6878',
        'text-halo-color': '#8AAABF',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'label-natural',
      type: 'symbol',
      source: 'streets',
      'source-layer': 'natural_label',
      filter: ['match', ['get', 'class'], ['peak', 'mountain', 'hill', 'valley', 'cliff'], true, false],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': 11,
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#506040',
        'text-halo-color': '#EDE8DC',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'label-road',
      type: 'symbol',
      source: 'streets',
      'source-layer': 'road_label',
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'symbol-placement': 'line',
        'text-max-angle': 30,
      },
      paint: {
        'text-color': '#786C50',
        'text-halo-color': '#EDE8DC',
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'label-place-town',
      type: 'symbol',
      source: 'streets',
      'source-layer': 'place_label',
      filter: ['match', ['get', 'class'], ['city', 'town'], true, false],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 15],
        'text-max-width': 8,
        'text-padding': 4,
      },
      paint: {
        'text-color': '#302820',
        'text-halo-color': '#EDE8DC',
        'text-halo-width': 2,
      },
    },
    {
      id: 'label-place-village',
      type: 'symbol',
      source: 'streets',
      'source-layer': 'place_label',
      filter: ['match', ['get', 'class'], ['village', 'suburb', 'neighborhood'], true, false],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'text-max-width': 6,
      },
      paint: {
        'text-color': '#504840',
        'text-halo-color': '#EDE8DC',
        'text-halo-width': 1.5,
      },
    },
  ],
} as const
