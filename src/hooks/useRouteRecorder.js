import { useState, useRef, useCallback, useEffect } from "react";
import { MIN_DISTANCE } from "../constants";

/**
 * Intervalo para sincronizar el ref con el estado de React (ms).
 * Durante la grabación, cada este tiempo se actualiza la UI.
 */
const SYNC_INTERVAL = 2000;

/**
 * Hook para grabar rutas GPS.
 *
 * CARACTERÍSTICAS CLAVE:
 * - Cuando inicia la grabación, crea su propio `watchPosition` que
 *   guarda puntos directamente en un ref. Esto permite que la ruta
 *   se siga grabando aunque la app esté minimizada o la pantalla
 *   bloqueada (el navegador sigue ejecutando el callback de
 *   geolocalización en segundo plano).
 * - Periódicamente sincroniza el ref con el estado de React para
 *   actualizar la UI.
 * - Al volver a primer plano (visibilitychange), sincroniza
 *   inmediatamente.
 * - Guarda la ruta actual en `sessionStorage` para no perder datos
 *   si la página se recarga accidentalmente.
 *
 * Cada vez que se detiene y reinicia se crea una ruta independiente.
 *
 * @param {object} [options]
 * @param {boolean} [options.enableHighAccuracy=true]
 * @returns {{
 *   isRecording: boolean,
 *   routes: Array<Array<{lat: number, lng: number}>>,
 *   currentRoute: Array<{lat: number, lng: number}>,
 *   startRecording: () => void,
 *   stopRecording: () => void,
 *   clearRoutes: () => void,
 * }}
 */
export default function useRouteRecorder({ enableHighAccuracy = true } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [routes, setRoutes] = useState(() => {
    // Recuperar rutas guardadas de sessionStorage al montar
    try {
      const saved = sessionStorage.getItem("mi-mapa-routes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentRoute, setCurrentRoute] = useState([]);

  // Refs para datos que deben persistir sin depender de re-renders
  const currentRouteRef = useRef([]);
  const lastPointRef = useRef(null);
  const watchIdRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // ---- Persistencia de rutas en sessionStorage ----
  useEffect(() => {
    try {
      sessionStorage.setItem("mi-mapa-routes", JSON.stringify(routes));
    } catch {
      // sessionStorage puede estar lleno
    }
  }, [routes]);

  // ---- Sincronizar ref → estado de React ----
  const syncRefToState = useCallback(() => {
    setCurrentRoute([...currentRouteRef.current]);
  }, []);

  // ---- Crear watchPosition propio al iniciar grabación ----
  const startWatching = useCallback(() => {
    // Si ya hay un watch activo, no crear otro
    if (watchIdRef.current !== null) return;

    const geo = navigator.geolocation;
    if (!geo) return;

    watchIdRef.current = geo.watchPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Evitar puntos duplicados o muy cercanos
        if (lastPointRef.current) {
          const dist = Math.sqrt(
            Math.pow(point.lat - lastPointRef.current.lat, 2) +
              Math.pow(point.lng - lastPointRef.current.lng, 2)
          );
          if (dist < MIN_DISTANCE) return;
        }

        lastPointRef.current = point;
        currentRouteRef.current = [...currentRouteRef.current, point];
      },
      (err) => {
        console.warn("Error en watchPosition de grabación:", err.message);
      },
      { enableHighAccuracy, timeout: 10000, maximumAge: 0 }
    );
  }, [enableHighAccuracy]);

  // ---- Detener watchPosition ----
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (syncIntervalRef.current !== null) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // ============ API pública ============

  const startRecording = useCallback(() => {
    // Guardar la ruta anterior si existe (por si acaso)
    if (currentRouteRef.current.length >= 2) {
      setRoutes((prev) => [...prev, [...currentRouteRef.current]]);
    }

    setIsRecording(true);
    currentRouteRef.current = [];
    setCurrentRoute([]);
    lastPointRef.current = null;

    // Iniciar watchPosition propio para grabar en segundo plano
    startWatching();

    // Sincronizar con React periódicamente
    syncIntervalRef.current = setInterval(() => {
      syncRefToState();
    }, SYNC_INTERVAL);

    // Sincronizar al volver a primer plano
    document.addEventListener("visibilitychange", syncRefToState, false);
  }, [startWatching, syncRefToState]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    // Detener watchPosition y limpiar
    stopWatching();

    // Sincronizar antes de guardar
    syncRefToState();

    // Remover listener de visibility
    document.removeEventListener("visibilitychange", syncRefToState, false);

    // Guardar la ruta actual en el historial si tiene al menos 2 puntos
    const routeToSave = currentRouteRef.current;
    if (routeToSave.length >= 2) {
      setRoutes((prev) => [...prev, [...routeToSave]]);
    }

    currentRouteRef.current = [];
    setCurrentRoute([]);
    lastPointRef.current = null;
  }, [stopWatching, syncRefToState]);

  const clearRoutes = useCallback(() => {
    setRoutes([]);
    setCurrentRoute([]);
    currentRouteRef.current = [];
    lastPointRef.current = null;
    try {
      sessionStorage.removeItem("mi-mapa-routes");
    } catch {
      // ignorar
    }
  }, []);

  // ---- Cleanup al desmontar ----
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
      }
      document.removeEventListener("visibilitychange", syncRefToState);
    };
  }, [syncRefToState]);

  return {
    isRecording,
    routes,
    currentRoute,
    startRecording,
    stopRecording,
    clearRoutes,
  };
}