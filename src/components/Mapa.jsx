import { useRef, useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import Marcador from "./Marcador";
import RouteLayer from "./RouteLayer";
import PoiMarker from "./PoiMarker";
import useMapTransform from "../hooks/useMapTransform";
import { latLngToPixel } from "../mapUtils";
import { MAP_IMAGE } from "../constants";
import poiData from "../data/poiData";
import mapa_barrio from "../assets/mapa.png";

/**
 * Mapa con zoom/pinch natural centrado en el punto de interacción.
 *
 * La imagen, el marcador GPS, las rutas y los POIs viven dentro de un
 * contenedor interno que se transforma con CSS (scale + translate).
 * Así todo se escala y mueve sincronizadamente.
 *
 * El zoom se centra en el punto donde el usuario hace pinch (2 dedos)
 * o gira la rueda del mouse, usando la fórmula:
 *   nuevoPan = punto - (punto - pan) * (nuevoZoom / zoomAnterior)
 *
 * @param {{ latitude, longitude, routes, currentRoute }} props
 * @param {React.Ref} ref - Expone { centerOnLocation() }
 */
const Mapa = forwardRef(function Mapa({ latitude, longitude, routes, currentRoute }, ref) {
  const {
    zoom,
    panX,
    panY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    containerRef,
    correctPan,
    setTransform,
  } = useMapTransform({ minZoom: 1, maxZoom: 5, initialZoom: 1 });

  // Tamaño del viewport (el contenedor visible)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Calcular el zoom inicial para que el mapa quepa completo en el viewport
  const fitZoom = useMemo(() => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) return 1;
    const zoomX = viewportSize.width / MAP_IMAGE.width;
    const zoomY = viewportSize.height / MAP_IMAGE.height;
    // El mapa debe caber completo, así que usamos el menor de los dos
    return Math.min(zoomX, zoomY);
  }, [viewportSize]);

  // Centrado inicial del mapa en el viewport
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

  // Observar el tamaño del contenedor (viewport)
  const imgRef = useRef(null);

  useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;

    function updateSize() {
      const w = cont.clientWidth;
      const h = cont.clientHeight;
      setViewportSize({ width: w, height: h });
      if (w > 0 && h > 0) {
        const fzX = w / MAP_IMAGE.width;
        const fzY = h / MAP_IMAGE.height;
        const fz = Math.min(fzX, fzY);
        setInitialOffset({
          x: (w - MAP_IMAGE.width * fz) / 2,
          y: (h - MAP_IMAGE.height * fz) / 2,
        });
      }
    }

    // Esperar a que la imagen cargue para medir bien
    const img = imgRef.current;
    function handleLoad() {
      updateSize();
    }
    if (img?.complete) {
      updateSize();
    } else if (img) {
      img.addEventListener("load", handleLoad);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(cont);

    return () => {
      if (img) img.removeEventListener("load", handleLoad);
      observer.disconnect();
    };
  }, [containerRef]);

  // ---- Clamping dinámico: evitar que el mapa se salga del viewport ----
  const clamp = useCallback((value, min, max) => Math.min(max, Math.max(min, value)), []);

  // Calcular posición del marcador GPS en píxeles REALES de la imagen
  const hasValidCoords = latitude !== null && longitude !== null;
  const realPos = hasValidCoords ? latLngToPixel(latitude, longitude) : null;

  // Escalar el zoom actual respecto al fitZoom
  // zoom=1 del hook = fitZoom visual (mapa completo visible)
  const effectiveZoom = zoom * fitZoom;

  // Tamaño del mapa en pantalla después del zoom
  const mapDisplayWidth = MAP_IMAGE.width * effectiveZoom;
  const mapDisplayHeight = MAP_IMAGE.height * effectiveZoom;

  // Límites de pan: el mapa nunca se sale del viewport
  // Si el mapa es más pequeño que el viewport, centrarlo (no permitir pan en ese eje)
  const minPanX = viewportSize.width - mapDisplayWidth;
  const maxPanX = 0;
  const minPanY = viewportSize.height - mapDisplayHeight;
  const maxPanY = 0;

  // Si el mapa es más pequeño que el viewport, centrarlo
  const centerX = mapDisplayWidth < viewportSize.width
    ? (viewportSize.width - mapDisplayWidth) / 2
    : null; // null significa que usamos el pan del usuario con clamping
  const centerY = mapDisplayHeight < viewportSize.height
    ? (viewportSize.height - mapDisplayHeight) / 2
    : null;

  // Pan visual = pan del usuario + centrado inicial (solo cuando zoom=1).
  // Cuando el usuario hace zoom, initialOffset ya no es válido porque el mapa
  // es más grande que el viewport y el usuario controla la posición.
  const applyOffset = zoom === 1;
  const rawVisualPanX = panX + (applyOffset ? initialOffset.x : 0);
  const rawVisualPanY = panY + (applyOffset ? initialOffset.y : 0);

  const visualPanX = centerX !== null
    ? centerX
    : clamp(rawVisualPanX, minPanX, maxPanX);
  const visualPanY = centerY !== null
    ? centerY
    : clamp(rawVisualPanY, minPanY, maxPanY);

  // Ref para recordar los últimos valores corregidos y evitar bucles
  const lastCorrectedRef = useRef({ panX: null, panY: null });

  // ---- Corregir pan interno cuando el clamping está activo ----
  // Si el valor visual es diferente del raw, significa que el clamping
  // está cortando el movimiento. Corregimos panX/panY para que no
  // acumulen distancia "invisible" que luego hay que deshacer.
  useEffect(() => {
    if (centerX !== null) {
      // El mapa es más chico que el viewport, centrado fijo
      const correctedPanX = centerX - (applyOffset ? initialOffset.x : 0);
      const correctedPanY = centerY - (applyOffset ? initialOffset.y : 0);
      if (
        (correctedPanX !== panX || correctedPanY !== panY) &&
        (correctedPanX !== lastCorrectedRef.current.panX || correctedPanY !== lastCorrectedRef.current.panY)
      ) {
        lastCorrectedRef.current = { panX: correctedPanX, panY: correctedPanY };
        correctPan(correctedPanX, correctedPanY);
      }
      return;
    }

    const clampedX = rawVisualPanX !== visualPanX;
    const clampedY = rawVisualPanY !== visualPanY;

    if (clampedX || clampedY) {
      const newPanX = clampedX ? visualPanX - (applyOffset ? initialOffset.x : 0) : panX;
      const newPanY = clampedY ? visualPanY - (applyOffset ? initialOffset.y : 0) : panY;
      if (
        (newPanX !== panX || newPanY !== panY) &&
        (newPanX !== lastCorrectedRef.current.panX || newPanY !== lastCorrectedRef.current.panY)
      ) {
        lastCorrectedRef.current = { panX: newPanX, panY: newPanY };
        correctPan(newPanX, newPanY);
      }
    }
  }, [rawVisualPanX, rawVisualPanY, visualPanX, visualPanY, panX, panY, centerX, centerY, initialOffset, correctPan]);

  // --- Aplicar transform al contenedor interno ---
  const innerStyle = useMemo(() => {
    return {
      transform: `translate(${visualPanX}px, ${visualPanY}px) scale(${effectiveZoom})`,
      transformOrigin: "0 0",
      width: `${MAP_IMAGE.width}px`,
      height: `${MAP_IMAGE.height}px`,
      position: "absolute",
      top: 0,
      left: 0,
    };
  }, [visualPanX, visualPanY, effectiveZoom]);

  // ---- Exponer método centerOnLocation al padre ----
  useImperativeHandle(ref, () => ({
    centerOnLocation: () => {
      if (latitude === null || longitude === null) return;
      const pixel = latLngToPixel(latitude, longitude);
      if (!pixel) return;

      // Zoom fijo de 3x (zoom del hook, que se multiplica por fitZoom)
      const targetZoom = 3;
      const targetEffectiveZoom = targetZoom * fitZoom;

      // Calcular pan para centrar el pixel en el viewport
      const targetPanX = (viewportSize.width / 2) - pixel.x * targetEffectiveZoom - initialOffset.x;
      const targetPanY = (viewportSize.height / 2) - pixel.y * targetEffectiveZoom - initialOffset.y;

      // Aplicar clamping
      const mapW = MAP_IMAGE.width * targetEffectiveZoom;
      const mapH = MAP_IMAGE.height * targetEffectiveZoom;
      const minPX = viewportSize.width - mapW;
      const maxPX = 0;
      const minPY = viewportSize.height - mapH;
      const maxPY = 0;

      const clampedPanX = mapW < viewportSize.width
        ? (viewportSize.width - mapW) / 2 - initialOffset.x
        : clamp(targetPanX, minPX, maxPX);
      const clampedPanY = mapH < viewportSize.height
        ? (viewportSize.height - mapH) / 2 - initialOffset.y
        : clamp(targetPanY, minPY, maxPY);

      setTransform(targetZoom, clampedPanX, clampedPanY);
    },
  }), [latitude, longitude, fitZoom, viewportSize, initialOffset, clamp, setTransform]);

  // Calcular posiciones de POIs en píxeles REALES de la imagen
  const poisConPosicion = useMemo(() => {
    return poiData
      .map((poi) => {
        const real = latLngToPixel(poi.lat, poi.lng);
        if (!real) return null;
        return { poi, x: real.x, y: real.y };
      })
      .filter((item) => item !== null);
  }, []);

  return (
    <div
      className="mapa-contenedor"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mapa-inner" style={innerStyle}>
        <img
          ref={imgRef}
          src={mapa_barrio}
          alt="Mapa del barrio"
          className="mapa-imagen"
          draggable={false}
          style={{
            width: `${MAP_IMAGE.width}px`,
            height: `${MAP_IMAGE.height}px`,
            display: "block",
            userSelect: "none",
            WebkitUserDrag: "none",
          }}
        />
        {realPos && <Marcador x={realPos.x} y={realPos.y} />}
        {viewportSize.width > 0 && (
          <RouteLayer
            routes={routes}
            currentRoute={currentRoute}
          />
        )}
        {poisConPosicion.map(({ poi, x, y }) => (
          <PoiMarker key={poi.id} poi={poi} x={x} y={y} />
        ))}
      </div>
    </div>
  );
});

export default Mapa;
