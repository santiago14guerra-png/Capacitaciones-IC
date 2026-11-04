import {
  CLASIFICACIONES,
  ESTADOS_CONSULTA,
  ETIQUETAS_CLASIFICACION,
  ETIQUETAS_ESTADO_CONSULTA,
  type ConsultaAdminDto,
  type EstadoConsulta as Estado,
} from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AvisoError, Campo } from '../../componentes/Campo';
import { EditorTexto } from '../../componentes/EditorTexto';
import { EstadoConsulta } from '../../componentes/EstadoConsulta';
import { api, ErrorApi } from '../../lib/api';
import { formatoFechaHora } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { abrirArchivo } from '../../lib/subida';
import { useCarga } from '../../lib/useCarga';
import { useAccion } from '../../lib/accion';
import { BotonAccion } from '../../componentes/BotonAccion';

/** HU-20: convierte la respuesta en una ficha borrador anonimizada para revisar. */
function ConvertirEnFicha({ consulta }: { consulta: ConsultaAdminDto }) {
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [convertir, convirtiendo] = useAccion(async () => {
    try {
      const f = await api<{ id: string }>(`/admin/consultas/${consulta.id}/ficha`, { cuerpo: {} });
      navegar(`/panel/fichas/${f.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo convertir');
    }
  });
  if (consulta.fichaId) {
    return (
      <p className="aviso exito">
        Esta respuesta ya se convirtió en ficha.{' '}
        <Link to={`/panel/fichas/${consulta.fichaId}`}>Abrir la ficha</Link>
      </p>
    );
  }
  if (
    !consulta.respuestaHtml ||
    (consulta.estado !== 'RESPONDIDA' && consulta.estado !== 'CERRADA')
  )
    return null;
  return (
    <div className="tarjeta pila">
      <h2>Reutilizar la respuesta</h2>
      <p>
        Cree una ficha <strong>borrador</strong> con esta pregunta y respuesta. Se quitan nombre,
        documento, correo, celular y dirección del cliente; revísela, complete resumen y precio, y
        publíquela.
      </p>
      <AvisoError mensaje={error} />
      <button
        className="boton secundario"
        type="button"
        onClick={convertir}
        disabled={convirtiendo}
        aria-busy={convirtiendo}
      >
        {convirtiendo ? 'Convirtiendo…' : 'Convertir en ficha'}
      </button>
    </div>
  );
}

function Formulario({
  consulta,
  alGuardar,
}: {
  consulta: ConsultaAdminDto;
  alGuardar(c: ConsultaAdminDto): void;
}) {
  const [estado, setEstado] = useState<Estado>(consulta.estado);
  const [clasificacion, setClasificacion] = useState(consulta.clasificacion ?? '');
  const [respuestaHtml, setRespuesta] = useState(consulta.respuestaHtml ?? '');
  const [condiciones, setCondiciones] = useState(consulta.condicionesAsesoria ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<{ tipo: string; texto: string } | null>(null);

  const [guardar, guardando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setErrores({});
    setAviso(null);
    try {
      const c = await api<ConsultaAdminDto>(`/admin/consultas/${consulta.id}`, {
        metodo: 'PUT',
        cuerpo: {
          estado,
          clasificacion: clasificacion || undefined,
          respuestaHtml: estado === 'RESPONDIDA' || respuestaHtml ? respuestaHtml : undefined,
          condicionesAsesoria: estado === 'ESCALADA' || condiciones ? condiciones : undefined,
        },
      });
      alGuardar(c);
      setAviso({ tipo: 'exito', texto: 'Cambios guardados.' });
    } catch (err) {
      if (err instanceof ErrorApi && Object.keys(err.campos).length) setErrores(err.campos);
      setAviso({ tipo: 'error', texto: err instanceof Error ? err.message : 'Ocurrió un error' });
    }
  });

  return (
    <form onSubmit={guardar} className="tarjeta pila" noValidate>
      <h2>Gestión</h2>
      {aviso && (
        <div className={`aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          {aviso.texto}
        </div>
      )}
      <fieldset className="campo" style={{ border: 0, padding: 0 }}>
        <legend className="etiqueta">Clasificación (obligatoria para avanzar)</legend>
        {CLASIFICACIONES.map((c) => (
          <label key={c} className="casilla">
            <input
              type="radio"
              name="clasificacion"
              checked={clasificacion === c}
              onChange={() => setClasificacion(c)}
            />
            {ETIQUETAS_CLASIFICACION[c]}
          </label>
        ))}
        {errores.clasificacion && <span className="error-campo">{errores.clasificacion}</span>}
      </fieldset>
      <Campo nombre="estado" etiqueta="Estado" error={errores.estado}>
        <select id="estado" value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
          {ESTADOS_CONSULTA.map((e) => (
            <option key={e} value={e}>
              {ETIQUETAS_ESTADO_CONSULTA[e]}
            </option>
          ))}
        </select>
      </Campo>
      {(estado === 'RESPONDIDA' || respuestaHtml) && (
        <div className="campo">
          <span className="etiqueta" id="respuesta-consulta">
            Respuesta (la verá el cliente en su cuenta)
          </span>
          <EditorTexto
            id="respuestaHtml"
            etiquetadoPor="respuesta-consulta"
            valor={respuestaHtml}
            alCambiar={setRespuesta}
            invalido={!!errores.respuestaHtml}
          />
          {errores.respuestaHtml && <span className="error-campo">{errores.respuestaHtml}</span>}
        </div>
      )}
      {(estado === 'ESCALADA' || condiciones) && (
        <Campo
          nombre="condiciones"
          etiqueta="Condiciones de la asesoría (las verá el cliente)"
          error={errores.condicionesAsesoria}
        >
          <textarea
            id="condiciones"
            rows={4}
            value={condiciones}
            onChange={(e) => setCondiciones(e.target.value)}
          />
        </Campo>
      )}
      <button className="boton" type="submit" disabled={guardando} aria-busy={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}

/** HU-16: detalle de la consulta con datos del cliente, adjunto y gestión. */
export default function GestionConsulta() {
  const { id } = useParams();
  const { datos, setDatos, error } = useCarga(
    (s) => api<ConsultaAdminDto>(`/admin/consultas/${id}`, { senal: s }),
    [id],
  );
  if (!datos) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  return (
    <section className="pila" style={{ maxWidth: 860 }}>
      <p>
        <Link to="/panel/consultas">← Consultas</Link>
      </p>
      <h1>
        {datos.radicado} · {datos.asunto}
      </h1>
      <p className="fila">
        <EstadoConsulta estado={datos.estado} />
        {datos.atrasada && <span className="estado rojo">Más de 48 h sin responder</span>}
        <span className="suave pequeno">Recibida {formatoFechaHora(datos.recibidaEn)}</span>
      </p>
      <dl className="datos tarjeta">
        <div className="dato">
          <dt>Cliente</dt>
          <dd>
            {datos.clienteNombre} · {datos.clienteCorreo}
          </dd>
        </div>
        <div className="dato">
          <dt>Categoría</dt>
          <dd>{datos.categoriaNombre}</dd>
        </div>
        <div className="dato">
          <dt>Descripción</dt>
          <dd style={{ whiteSpace: 'pre-wrap' }}>{datos.descripcion}</dd>
        </div>
        {datos.tieneAdjunto && (
          <div className="dato">
            <dt>Adjunto</dt>
            <dd>
              <BotonAccion
                ocupadoTexto="Abriendo…"
                className="enlace-boton"
                alPulsar={() => abrirArchivo(`/admin/consultas/${datos.id}/adjunto`)}
              >
                Ver adjunto
              </BotonAccion>
            </dd>
          </div>
        )}
      </dl>
      <Formulario key={datos.id} consulta={datos} alGuardar={setDatos} />
      <ConvertirEnFicha consulta={datos} />
    </section>
  );
}
