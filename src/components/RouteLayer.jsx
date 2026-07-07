import { useMemo } from "react";
import { routeToRealPixels } from "../mapUtils";
import { MAP_IMAGE } from "../constants";

/**
 * Capa SVG que dibuja las rutas grabadas sobre el mapa.
 * Usa las coordenadas REALES de la imagen (MAP_IMAGE).
 * El zoom/pan se aplica via CSS transform en el contenedor padre.
 *
 * @param {{
 *   routes: Array<Array<{lat: number, lng: number}>>,
 *   currentRoute: Array<{lat: number, lng: number}>,
 * }} props
 */
export default function RouteLayer({
  routes,
  currentRoute,
}) {
  // Convertir ruta actual a píxeles REALES de la imagen
  const currentRealPoints = useMemo(() => {
    return routeToRealPixels(currentRoute);
  }, [currentRoute]);

  // Convertir rutas guardadas a píxeles REALES de la imagen
  const allRoutesRealPoints = useMemo(
    () =>
      routes
        .filter((r) => r.length >= 2)
        .map((route) => routeToRealPixels(route)),
    [routes]
  );

  // Generar string de path SVG para un array de puntos
  const toPath = (points) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      className="rute-layer"
      width={MAP_IMAGE.width}
      height={MAP_IMAGE.height}
      viewBox={`0 0 ${MAP_IMAGE.width} ${MAP_IMAGE.height}`}
    >
      {/* Rutas completadas (azul) */}
      {allRoutesRealPoints.map((points, idx) => {
        if (points.length < 2) return null;
        return (
          <path
            key={`route-${idx}`}
            d={toPath(points)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        );
      })}
      {/* Ruta actual (rojo) */}
      {currentRealPoints.length >= 2 && (
        <path
          d={toPath(currentRealPoints)}
          fill="none"
          stroke="#ef4444"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      )}
    </svg>
  );
}
