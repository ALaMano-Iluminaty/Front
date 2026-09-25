/**
 * Teselas de CartoDB (sobre datos de OpenStreetMap): livianas, sin API key y
 * con variante oscura. El tema se elige al cargar; cambiar de tema con la
 * app abierta no recarga las teselas, y no merece la pena hacerlo.
 */
const prefersDark =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export const TILE_URL = prefersDark
  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
  : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
