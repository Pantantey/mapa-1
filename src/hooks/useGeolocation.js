import { useState, useEffect } from "react";

/**
 * Hook personalizado que obtiene y sigue la ubicación GPS del usuario.
 *
 * @param {object} options - Opciones de geolocalización.
 * @param {boolean} [options.enableHighAccuracy=true] - Precisión alta.
 * @param {number} [options.timeout=10000] - Tiempo máximo de espera (ms).
 * @param {number} [options.maximumAge=0] - No usar posiciones en caché.
 * @returns {{ latitude: number|null, longitude: number|null, error: string|null, loading: boolean }}
 */
export default function useGeolocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const notSupported =
    typeof navigator !== "undefined" && !("geolocation" in navigator);

  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(
    notSupported ? "Geolocalización no soportada por el navegador." : null
  );
  const [loading, setLoading] = useState(!notSupported);

  useEffect(() => {
    if (notSupported) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        const messages = {
          [err.PERMISSION_DENIED]: "Permiso de geolocalización denegado.",
          [err.POSITION_UNAVAILABLE]: "Posición no disponible.",
          [err.TIMEOUT]: "Tiempo de espera agotado.",
        };
        setError(messages[err.code] || "Error desconocido al obtener la ubicación.");
        setLoading(false);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
    // notSupported es constante para la vida del hook, no necesita estar en deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableHighAccuracy, timeout, maximumAge]);

  return { ...coords, error, loading };
}