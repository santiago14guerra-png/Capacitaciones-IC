import { Link } from 'react-router';
import { SECCIONES_PANEL } from './DisenoPanel';

export default function InicioPanel() {
  return (
    <section className="pila">
      <h1>Panel de administración</h1>
      <div className="rejilla">
        {SECCIONES_PANEL.map((s) => (
          <Link
            key={s.ruta}
            to={`/panel/${s.ruta}`}
            className="tarjeta"
            style={{ textDecoration: 'none' }}
          >
            <h2 style={{ fontSize: '1.15rem' }}>{s.nombre}</h2>
            <p className="suave" style={{ margin: 0 }}>
              {s.descripcion}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
