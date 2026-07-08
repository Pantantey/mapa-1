/**
 * Puntos de Interés (POIs) para mostrar en el mapa.
 *
 * Cómo agregar un nuevo punto:
 * 1. Agrega un objeto a este array con:
 *    - id:          Identificador único (número)
 *    - titulo:      Texto que se muestra en el modal
 *    - descripcion: Texto descriptivo más detallado
 *    - imagen:      Ruta a la imagen dentro de src/assets/ (ej: "mi-casa.png")
 *    - lat:         Latitud (dentro de BOUNDS)
 *    - lng:         Longitud (dentro de BOUNDS)
 *    - tamaño:      (opcional) Tamaño del marcador en píxeles. 40 por defecto.
 *                   Valores recomendados: 30 (pequeño), 40 (medio), 56 (grande).
 *                   Si no se especifica, usa 40px.
 *
 * 2. Coloca la imagen en: src/assets/
 *
 * Ejemplo:
 * {
 *   id: 1,
 *   titulo: "Mi Casa",
 *   descripcion: "Aquí vivo",
 *   imagen: "mi-casa.png",
 *   lat: 10.0685,
 *   lng: -84.4700,
 *   tamaño: 40,
 * }
 */
const poiData = [
  // ==============================
  //  AGREGA TUS PUNTOS AQUÍ ABAJO
  // ==============================
  {
    id: 1,
    titulo: "Senderos",
    descripcion: "inicio de los senderos",
    imagen: "arbol_hueco.jpg",
    lat: 10.184036,
    lng: -84.485695,
    tamaño: 59,
  },
  {
    id: 2,
    titulo: "Villa Blanca",
    descripcion: "Hotel Villa Blanca Cloud Forest Hotel & Nature Reserve",
    imagen: "catarata.png",
    lat: 10.204036,
    lng: -84.485695,
    tamaño: 72,
  },
];

export default poiData;