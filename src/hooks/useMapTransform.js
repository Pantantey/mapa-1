import { useState, useRef, useCallback, useEffect } from "react";
import { PAN_SPEED_FACTOR, PAN_ZOOM_COMPENSATION } from "../constants";

/**
 * Hook para manejar zoom (pinch/rueda) y pan (arrastrar) en el mapa.
 *
 * El zoom se centra en el punto donde el usuario hace pinch o gira la rueda,
 * usando la fórmula: nuevoPan = punto - (punto - pan) * (nuevoZoom / zoomAnterior)
 *
 * @param {object} options
 * @param {number} options.minZoom - Zoom mínimo (default 1)
 * @param {number} options.maxZoom - Zoom máximo (default 5)
 * @param {number} options.initialZoom - Zoom inicial (default 1)
 * @returns {{
 *   zoom: number,
 *   panX: number,
 *   panY: number,
 *   handleTouchStart: (e: React.TouchEvent) => void,
 *   handleTouchMove: (e: React.TouchEvent) => void,
 *   handleTouchEnd: (e: React.TouchEvent) => void,
 *   containerRef: React.RefObject<HTMLDivElement>,
 *   resetTransform: () => void,
 * }}
 */
export default function useMapTransform({
  minZoom = 1,
  maxZoom = 5,
  initialZoom = 1,
} = {}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const containerRef = useRef(null);

  // Refs para el estado del pinch/pan en curso
  const pinchRef = useRef(null); // { centerX, centerY, dist, zoomAtStart, panXAtStart, panYAtStart }
  const panRef = useRef(null); // { startX, startY, panXAtStart, panYAtStart }

  // ---- Touch handlers ----
  const handleTouchStart = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touches = e.touches;
    if (touches.length === 2) {
      e.preventDefault();
      const t1 = touches[0];
      const t2 = touches[1];
      // Convertir a coordenadas relativas al contenedor
      const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
      const cy = (t1.clientY + t2.clientY) / 2 - rect.top;
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      setZoom((z) => {
        setPanX((px) => {
          setPanY((py) => {
            pinchRef.current = {
              centerX: cx,
              centerY: cy,
              dist,
              zoomAtStart: z,
              panXAtStart: px,
              panYAtStart: py,
            };
            return py;
          });
          return px;
        });
        return z;
      });
    } else if (touches.length === 1) {
      // Iniciar pan (arrastre) con 1 dedo
      const t = touches[0];
      // Convertir a coordenadas relativas al contenedor
      const cx = t.clientX - rect.left;
      const cy = t.clientY - rect.top;
      setZoom((z) => {
        setPanX((px) => {
          setPanY((py) => {
            panRef.current = {
              startX: cx,
              startY: cy,
              panXAtStart: px,
              panYAtStart: py,
              zoomAtStart: z,
            };
            return py;
          });
          return px;
        });
        return z;
      });
    }
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const touches = e.touches;

      if (touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const t1 = touches[0];
        const t2 = touches[1];
        // Convertir a coordenadas relativas al contenedor
        const cx = (t1.clientX + t2.clientX) / 2 - rect.left;
        const cy = (t1.clientY + t2.clientY) / 2 - rect.top;
        const dist = Math.hypot(
          t1.clientX - t2.clientX,
          t1.clientY - t2.clientY
        );

        const { dist: startDist, zoomAtStart } = pinchRef.current;
        const scale = dist / startDist;

        // Usar functional updates para evitar usar valores desactualizados
        // cuando el clamping (en Mapa.jsx) corrige panX/panY durante el gesto.
        setZoom((prevZoom) => {
          const newZoom = Math.min(
            maxZoom,
            Math.max(minZoom, zoomAtStart * scale)
          );
          setPanX((prevPanX) => cx - (cx - prevPanX) * (newZoom / prevZoom));
          setPanY((prevPanY) => cy - (cy - prevPanY) * (newZoom / prevZoom));
          return newZoom;
        });
      } else if (touches.length === 1 && panRef.current) {
        const t = touches[0];
        // Convertir a coordenadas relativas al contenedor
        const cx = t.clientX - rect.left;
        const cy = t.clientY - rect.top;
        const { startX, startY, panXAtStart, panYAtStart } = panRef.current;
        // Delta INCREMENTAL desde el último touchMove (no acumulado desde el inicio).
        // Esto evita que el clamping bloquee el cambio de dirección:
        // como actualizamos startX/panXAtStart en cada frame, si el clamping
        // corrigió el pan, la siguiente iteración parte del valor corregido.
        const dx = (cx - startX) * PAN_SPEED_FACTOR;
        const dy = (cy - startY) * PAN_SPEED_FACTOR;

        setZoom((prevZoom) => {
          // Compensar la velocidad según el zoom usando el factor configurable.
          // Con PAN_ZOOM_COMPENSATION=0 no hay compensación (misma velocidad siempre).
          // Con PAN_ZOOM_COMPENSATION=1 se divide directamente por el zoom (muy lento a zoom alto).
          const zoomFactor = Math.pow(prevZoom, 1 - PAN_ZOOM_COMPENSATION);
          const newPanX = panXAtStart + dx / zoomFactor;
          const newPanY = panYAtStart + dy / zoomFactor;
          setPanX(() => newPanX);
          setPanY(() => newPanY);
          // Actualizar referencias para el próximo frame: partimos de donde
          // estamos ahora, no del inicio original del gesto.
          panRef.current = {
            ...panRef.current,
            startX: cx,
            startY: cy,
            panXAtStart: newPanX,
            panYAtStart: newPanY,
          };
          return prevZoom;
        });
      }
    },
    [minZoom, maxZoom]
  );

  const handleTouchEnd = useCallback((e) => {
    const touches = e.touches;

    // Si pasamos de 2 dedos a 1 dedo, iniciar pan con el dedo restante
    if (touches.length === 1 && pinchRef.current) {
      pinchRef.current = null;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const t = touches[0];
      const cx = t.clientX - rect.left;
      const cy = t.clientY - rect.top;
      setZoom((z) => {
        setPanX((px) => {
          setPanY((py) => {
            panRef.current = {
              startX: cx,
              startY: cy,
              panXAtStart: px,
              panYAtStart: py,
              zoomAtStart: z,
            };
            return py;
          });
          return px;
        });
        return z;
      });
      return;
    }

    if (touches.length < 2) {
      pinchRef.current = null;
    }
    if (touches.length === 0) {
      panRef.current = null;
    }
  }, []);

  // ---- Rueda del mouse (usamos addEventListener para poder pasar { passive: false }) ----
  const wheelHandlerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      if (!rect) return;

      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 1 / 1.1;

      setZoom((prevZoom) => {
        const newZoom = Math.min(maxZoom, Math.max(minZoom, prevZoom * factor));
        setPanX((prevPanX) => cx - (cx - prevPanX) * (newZoom / prevZoom));
        setPanY((prevPanY) => cy - (cy - prevPanY) * (newZoom / prevZoom));
        return newZoom;
      });
    };

    wheelHandlerRef.current = handler;
    container.addEventListener("wheel", handler, { passive: false });

    return () => {
      container.removeEventListener("wheel", handler);
    };
  }, [minZoom, maxZoom]);

  // ---- Reset ----
  const resetTransform = useCallback(() => {
    setZoom(initialZoom);
    setPanX(0);
    setPanY(0);
  }, [initialZoom]);

  // ---- Corregir pan interno (para sincronizar con clamping visual) ----
  const correctPan = useCallback((newPanX, newPanY) => {
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  // ---- Fijar zoom y pan directamente ----
  const setTransform = useCallback((newZoom, newPanX, newPanY) => {
    setZoom(newZoom);
    setPanX(newPanX);
    setPanY(newPanY);
  }, []);

  return {
    zoom,
    panX,
    panY,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    containerRef,
    resetTransform,
    correctPan,
    setTransform,
  };
}