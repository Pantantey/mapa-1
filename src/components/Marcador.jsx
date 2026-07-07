/**
 * Marcador que se muestra sobre el mapa en la posición GPS del usuario.
 *
 * @param {{ x: number, y: number }} props
 * @param {number} props.x - Posición horizontal en píxeles relativa al contenedor del mapa.
 * @param {number} props.y - Posición vertical en píxeles relativa al contenedor del mapa.
 */
export default function Marcador({ x, y }) {
  return (
    <div
      className="marcador"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="marcador-pin" />
      <div className="marcador-pulse" />
    </div>
  );
}