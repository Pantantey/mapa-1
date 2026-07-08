/**
 * Límites geográficos del mapa (bounding box).
 * Esquina superior izquierda = (norte, oeste)
 * Esquina inferior derecha = (sur, este)
 *
 * CAMBIA estos valores según tu imagen.
 */
export const BOUNDS = {
  north: 10.214036,
  south: 10.153465,
  west: -84.509695,
  east: -84.460171,
};

/**
 * Dimensiones REALES de la imagen del mapa en píxeles.
 * La imagen actual es 602×905.
 * Si cambias la imagen, actualiza estos valores.
 */
export const MAP_IMAGE = {
  width: 579,
  height: 722,
};

/**
 * Distancia mínima entre puntos de ruta en grados (aprox. 1° = 111 km).
 *
 * - 0.00005 ≈ 5.5 metros (bueno para caminar, evita ruido del GPS)
 * - 0.00010 ≈ 11 metros (ideal para bicicleta o carro en ciudad)
 * - 0.00001 ≈ 1 metro  (demasiado sensible, genera muchos puntos)
 * - 0.00050 ≈ 55 metros (solo para trayectos largos)
 *
 * Ajusta este valor si quieres más o menos puntos en tus rutas.
 */
export const MIN_DISTANCE = 0.00005;

/**
 * Factor de altura en modo vertical (portrait).
 * 1.0 = misma altura que landscape,
 * 1.5 = 50% más alto (ocupa más espacio vertical),
 * 2.0 = el doble de alto.
 *
 * Ajusta este valor para controlar cuánto se estira el mapa
 * hacia abajo cuando el teléfono está en vertical.
 */
export const VERTICAL_HEIGHT_FACTOR = 0.454;

/**
 * Factor de velocidad al arrastrar (pan) el mapa con el dedo.
 * 1.0 = velocidad normal,
 * 1.5 = 50% más rápido,
 * 2.0 = el doble de rápido.
 *
 * Ajusta este valor si sientes que el mapa se mueve muy lento
 * o muy rápido al arrastrarlo.
 */
export const PAN_SPEED_FACTOR = 1.5;

/**
 * Compensación del arrastre según el nivel de zoom.
 * Controla cuánto se reduce la velocidad al hacer zoom.
 *
 * - 0.0 = misma velocidad sin importar el zoom (sin compensación)
 * - 0.5 = punto medio: a zoom 5× se mueve ~2.2× más lento (recomendado)
 * - 1.0 = comportamiento anterior: a zoom 5× se mueve 5× más lento (muy lento)
 *
 * La fórmula usada es: dx / Math.pow(zoom, 1 - PAN_ZOOM_COMPENSATION).
 */
export const PAN_ZOOM_COMPENSATION = 0.4;