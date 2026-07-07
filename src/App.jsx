import { useRef } from "react";
import useGeolocation from "./hooks/useGeolocation";
import useRouteRecorder from "./hooks/useRouteRecorder";
import Mapa from "./components/Mapa";
import "./App.css";

function App() {
  const { latitude, longitude, error, loading } = useGeolocation();
  const {
    isRecording,
    routes,
    currentRoute,
    startRecording,
    stopRecording,
    clearRoutes,
  } = useRouteRecorder();

  const mapaRef = useRef(null);

  const handleCenter = () => {
    mapaRef.current?.centerOnLocation();
  };

  return (
    <div className="app">
      <h1 className="app-titulo">Mapa Prototipo</h1>

      {loading && <p className="app-mensaje">Obteniendo ubicación...</p>}

      {error && (
        <div className="app-error">
          <p>Error: permiso denegado</p>
        </div>
      )}

      {!loading && !error && (
        <p className="app-coords">
          Lat: {latitude?.toFixed(5)} &middot; Lng: {longitude?.toFixed(5)}
        </p>
      )}

      <Mapa
        ref={mapaRef}
        latitude={latitude}
        longitude={longitude}
        routes={routes}
        currentRoute={currentRoute}
      />

      <div className="controles-ruta">
        <button
          className={`btn-ruta ${isRecording ? "btn-ruta-grabando" : "btn-ruta-detener"}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "⏹ Detener grabación" : "⏺ Grabar ruta"}
        </button>

        <button
          className="btn-ruta btn-ruta-centrar"
          onClick={handleCenter}
          disabled={latitude === null || longitude === null}
        >
          📍 Centrar
        </button>

        {routes.length > 0 && (
          <button className="btn-ruta btn-ruta-limpiar" onClick={clearRoutes}>
            🗑 Limpiar rutas
          </button>
        )}
      </div>
    </div>
  );
}

export default App;