import { createPortal } from "react-dom";

/**
 * Modal que muestra la información de un Punto de Interés (POI).
 * Imagen grande, título y descripción.
 * Se renderiza via createPortal en document.body para evitar
 * problemas con position: fixed dentro de elementos con CSS transform.
 * Se cierra al hacer clic en el fondo oscuro o en la X.
 *
 * @param {{
 *   poi: { id: number, titulo: string, descripcion: string, imagen: string },
 *   imgSrc: string,
 *   onClose: () => void,
 * }} props
 */
export default function PoiModal({ poi, imgSrc, onClose }) {
  return createPortal(
    <div className="poi-modal-overlay" onClick={onClose}>
      <div className="poi-modal" onClick={(e) => e.stopPropagation()}>
        <button className="poi-modal-cerrar" onClick={onClose}>
          &times;
        </button>

        {imgSrc && (
          <img
            src={imgSrc}
            alt={poi.titulo}
            className="poi-modal-imagen"
          />
        )}

        <div className="poi-modal-contenido">
          <h2 className="poi-modal-titulo">{poi.titulo}</h2>
          <p className="poi-modal-descripcion">{poi.descripcion}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}