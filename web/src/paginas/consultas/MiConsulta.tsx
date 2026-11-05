import type { ConsultaDto } from '@ic/shared';
import { Link, useParams } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { EstadoConsulta } from '../../componentes/EstadoConsulta';
import { HtmlSeguro } from '../../componentes/HtmlSeguro';
import { api } from '../../lib/api';
import { formatoFechaHora } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { abrirArchivo } from '../../lib/subida';
import { useCarga } from '../../lib/useCarga';
import { BotonAccion } from '../../componentes/BotonAccion';

/** HU-17: estado y respuesta de una consulta dentro de la plataforma. */
export default function MiConsulta() {
  const { id } = useParams();
  const { datos: c, error } = useCarga(
    (s) => api<ConsultaDto>(`/consultas/${id}`, { senal: s }),
    [id],
  );
  if (!c) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  return (
    <section className="pila" style={{ maxWidth: 820 }}>
      <p>
        <Link to="/cuenta/consultas">← Mis consultas</Link>
      </p>
      <h1>{c.asunto}</h1>
      <p className="fila">
        <EstadoConsulta estado={c.estado} />
        <span className="suave pequeno">
          {c.radicado} · {c.categoriaNombre} · Recibida {formatoFechaHora(c.recibidaEn)}
        </span>
      </p>
      <div className="tarjeta">
        <h2 className="ficha-subtitulo">Su consulta</h2>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{c.descripcion}</p>
        {c.tieneAdjunto && (
          <BotonAccion
            ocupadoTexto="Abriendo…"
            className="enlace-boton"
            alPulsar={() => abrirArchivo(`/consultas/${c.id}/adjunto`)}
          >
            Ver adjunto
          </BotonAccion>
        )}
      </div>
      {(c.estado === 'RECIBIDA' || c.estado === 'EN_ANALISIS') && (
        <p className="aviso info">
          Un director está revisando su consulta. Le avisaremos por correo cuando tenga respuesta.
        </p>
      )}
      {c.respuestaHtml && (
        <div>
          <h2 className="ficha-subtitulo">
            Respuesta{' '}
            {c.respondidaEn && (
              <span className="pequeno">· {formatoFechaHora(c.respondidaEn)}</span>
            )}
          </h2>
          <HtmlSeguro className="respuesta-completa contenido-html" html={c.respuestaHtml} />
        </div>
      )}
      {c.condicionesAsesoria && (
        <div className="aviso info">
          <h2 className="ficha-subtitulo">Su caso requiere una asesoría</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{c.condicionesAsesoria}</p>
          <Link to="/tarifas">Ver tarifas y alcance</Link>
        </div>
      )}
    </section>
  );
}
