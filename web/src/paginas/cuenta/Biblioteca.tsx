import type { CompraDto } from '@ic/shared';
import { Link } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { EstadoCompra } from '../../componentes/EstadoCompra';
import { api } from '../../lib/api';
import { formatoFecha, formatoPrecio } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';

/** HU-14: fichas adquiridas con su fecha de compra y estado de las compras pendientes. */
export default function Biblioteca() {
  const { datos, error } = useCarga((s) => api<CompraDto[]>('/compras', { senal: s }), []);
  if (!datos) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  const aprobadas = datos.filter((c) => c.estado === 'APROBADA');
  const enCurso = datos.filter((c) => c.estado !== 'APROBADA');
  return (
    <section className="pila">
      <p>
        <Link to="/cuenta">← Mi cuenta</Link>
      </p>
      <h1>Mi biblioteca</h1>
      {enCurso.length > 0 && (
        <section aria-labelledby="en-curso" className="pila">
          <h2 id="en-curso">Compras en curso</h2>
          <ul className="lista-simple">
            {enCurso.map((c) => (
              <li key={c.id} className="tarjeta fila entre">
                <div>
                  <strong>{c.fichaTitulo}</strong>
                  <div className="pequeno suave">
                    {c.referencia} · {formatoPrecio(c.valor)}
                  </div>
                </div>
                <div className="fila">
                  <EstadoCompra estado={c.estado} />
                  <Link to={`/compras/${c.id}`}>
                    {c.estado === 'RECHAZADA' ? 'Ver motivo' : 'Ver pago'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="mis-fichas" className="pila">
        <h2 id="mis-fichas">Mis respuestas</h2>
        {aprobadas.length === 0 ? (
          <p className="suave">
            Aún no tiene respuestas. <Link to="/catalogo">Explore el catálogo</Link>.
          </p>
        ) : (
          <ul className="lista-simple">
            {aprobadas.map((c) => (
              <li key={c.id} className="tarjeta fila entre">
                <div>
                  <Link to={`/fichas/${c.fichaId}`}>
                    <strong>{c.fichaTitulo}</strong>
                  </Link>
                  <div className="pequeno suave">
                    Comprada el {formatoFecha(c.aprobadaEn ?? c.actualizadaEn)}
                  </div>
                </div>
                {c.fichaEnRevision && <span className="estado amarillo">En revisión</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
