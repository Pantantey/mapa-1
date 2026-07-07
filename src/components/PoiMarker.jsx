import { useState } from "react";
import PoiModal from "./PoiModal";

// Importar todas las imágenes de assets para que Vite las procese en build time
const images = import.meta.glob("../assets/*", { eager: true });

/**
 * Obtiene la URL de una imagen de assets por su nombre de archivo.
 */
function getImageUrl(filename) {
  const key = `../assets/${filename}`;
  return images[key]?.default || "";
}

/**
 * Marcador de Punto de Interés (POI) en el mapa.
 * Muestra un cuadrado con esquinas redondeadas y la imagen dentro.
 * El tamaño base depende del campo "tamaño" en poiData (default 40px).
 * El zoom/pan se aplica via CSS transform en el contenedor padre,
 * por lo que el tamaño es fijo en coordenadas de la imagen real.
 * Al hacer clic abre un modal con la info completa.
 *
 * @param {{
 *   poi: { id: number, titulo: string, descripcion: string, imagen: string, lat: number, lng: number, tamaño?: number },
 *   x: number,
 *   y: number,
 * }} props
 */
export default function PoiMarker({ poi, x, y }) {
  const [isOpen, setIsOpen] = useState(false);
  const imgSrc = getImageUrl(poi.imagen);
  const displaySize = poi.tamaño || 40;
  const borderRadius = Math.round(displaySize * 0.2); // 20% para esquinas redondeadas

  return (
    <>
      <div
        className="poi-marcador"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
        onClick={() => setIsOpen(true)}
        title={poi.titulo}
      >
        <div
          className="poi-cuadrado"
          style={{
            width: `${displaySize}px`,
            height: `${displaySize}px`,
            borderRadius: `${borderRadius}px`,
          }}
        >
          {imgSrc && (
            <img
              src={imgSrc}
              alt={poi.titulo}
              className="poi-imagen"
              draggable={false}
            />
          )}
        </div>
      </div>

      {isOpen && (
        <PoiModal poi={poi} imgSrc={imgSrc} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}