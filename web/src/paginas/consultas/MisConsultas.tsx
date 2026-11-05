import type { ConsultaDto } from '@ic/shared';
import { Link } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { EstadoConsulta } from '../../componentes/EstadoConsulta';
import { api } from '../../lib/api';
import { formatoFechaHora } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';

/** HU-17: consultas del cliente con radicado, estado y fecha. */
export default function MisConsultas() {
  const { datos, error } = useCarga((s) => api<ConsultaDto[]>('/consultas', { senal: s }), []);
  if (!datos) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  return (
    <section className="pila">
      <p>
        <Link to="/cuenta">← Mi cuenta</Link>
      </p>
      <div className="fila entre">
        <h1 style={{ margin: 0 }}>Mis consultas</h1>
        <Link className="boton" to="/consultas/nueva">
          Nueva consulta
        </Link>
      </div>
      {datos.length === 0 ? (
        <p className="suave">Aún no ha enviado consultas.</p>
      ) : (
        <ul className="lista-simple">
          {datos.map((c) => (
            <li key={c.id} className="tarjeta fila entre">
              <div>
                <Link to={`/cuenta/consultas/${c.id}`}>
                  <strong>{c.asunto}</strong>
                </Link>
                <div className="pequeno suave">
                  {c.radicado} · Recibida {formatoFechaHora(c.recibidaEn)}
                </div>
              </div>
              <EstadoConsulta estado={c.estado} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
