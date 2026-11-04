/** Tarjetas vacías mientras carga el catálogo: la página no salta cuando llegan los datos. */
export function Esqueletos({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div className="rejilla" role="status" aria-label="Cargando respuestas">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="esqueleto" aria-hidden="true">
          <span style={{ width: '40%' }} />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
