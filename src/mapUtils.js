import { BOUNDS, MAP_IMAGE } from "./constants";

/**
 * Verifica si unas coordenadas están dentro de los límites del mapa.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
export function isInsideBounds(lat, lng) {
  return (
    lat >= BOUNDS.south &&
    lat <= BOUNDS.north &&
    lng >= BOUNDS.west &&
    lng <= BOUNDS.east
  );
}

/**
 * Convierte coordenadas geográficas a píxeles DENTRO de la imagen real.
 * Usa MAP_IMAGE (constants.js) como dimensiones reales de la imagen.
 * Retorna null si las coordenadas están fuera del mapa.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ x: number, y: number } | null}
 */
export function latLngToPixel(lat, lng) {
  if (!isInsideBounds(lat, lng)) return null;

  const x =
    ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * MAP_IMAGE.width;
  const y =
    ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * MAP_IMAGE.height;
  return { x, y };
}

/**
 * Convierte un array de coordenadas geográficas a píxeles en la imagen real.
 * Filtra automáticamente los puntos fuera del mapa.
 *
 * @param {Array<{lat: number, lng: number}>} route
 * @returns {Array<{x: number, y: number}>}
 */
export function routeToRealPixels(route) {
  return route
    .map((p) => latLngToPixel(p.lat, p.lng))
    .filter((p) => p !== null);
}