import { Link } from 'react-router';

/** HU-02 CA4: autorización obligatoria con enlace a la política. */
export function CasillaAutorizacion(p: {
  marcada: boolean;
  alCambiar(v: boolean): void;
  error?: string;
}) {
  return (
    <div className="campo">
      <label className="casilla" htmlFor="autorizaDatos" style={{ fontWeight: 400 }}>
        <input
          id="autorizaDatos"
          type="checkbox"
          checked={p.marcada}
          onChange={(e) => p.alCambiar(e.target.checked)}
          aria-invalid={p.error ? true : undefined}
        />
        <span>
          Autorizo el tratamiento de mis datos personales según la{' '}
          <Link to="/privacidad" target="_blank" rel="noopener">
            política de tratamiento de datos
          </Link>{' '}
          (Ley 1581 de 2012).
        </span>
      </label>
      {p.error && <span className="error-campo">{p.error}</span>}
    </div>
  );
}
