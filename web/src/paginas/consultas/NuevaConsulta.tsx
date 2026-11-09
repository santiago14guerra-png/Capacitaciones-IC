import {
  esquemaConsulta,
  LIMITES,
  type CategoriaDto,
  type ConsultaDto,
  type ResultadoBusquedaDto,
} from '@ic/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AvisoError, Campo } from '../../componentes/Campo';
import { SelectorArchivo } from '../../componentes/SelectorArchivo';
import { api } from '../../lib/api';
import { formatoFechaHora, formatoPrecio } from '../../lib/formato';
import { useFormulario } from '../../lib/formulario';
import { subirArchivo } from '../../lib/subida';
import { useCarga } from '../../lib/useCarga';
import { useAccion } from '../../lib/accion';

/** Mientras escribe el asunto, sugiere fichas que quizá ya respondan su duda (HU-15). */
function useSugerencias(asunto: string) {
  const [sugerencias, setSugerencias] = useState<ResultadoBusquedaDto['elementos']>([]);
  useEffect(() => {
    const q = asunto.trim();
    if (q.length < LIMITES.terminoMin) return setSugerencias([]);
    const control = new AbortController();
    const t = setTimeout(() => {
      api<ResultadoBusquedaDto>(`/fichas?q=${encodeURIComponent(q)}&sugerencia=1`, {
        senal: control.signal,
      })
        .then((r) => setSugerencias(r.elementos.slice(0, 3)))
        .catch(() => undefined);
    }, 400);
    return () => {
      clearTimeout(t);
      control.abort();
    };
  }, [asunto]);
  return sugerencias;
}

export default function NuevaConsulta() {
  const categorias = useCarga((s) => api<CategoriaDto[]>('/categorias', { senal: s }), []);
  const f = useFormulario({ categoriaId: '', asunto: '', descripcion: '' });
  const [adjunto, setAdjunto] = useState<File | null>(null);
  const [enviada, setEnviada] = useState<ConsultaDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sugerencias = useSugerencias(f.valores.asunto);

  const [enviar, enviando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const d = f.validar(esquemaConsulta);
    if (!d) return;
    try {
      const adjuntoLlave = adjunto
        ? await subirArchivo('/consultas/adjunto/subida', adjunto)
        : undefined;
      setEnviada(await api<ConsultaDto>('/consultas', { cuerpo: { ...d, adjuntoLlave } }));
      window.scrollTo(0, 0);
    } catch (err) {
      if (!f.errorApi(err)) setError(err instanceof Error ? err.message : 'No se pudo enviar');
    }
  });

  if (enviada) {
    return (
      <section className="pila formulario">
        <h1>Recibimos su consulta</h1>
        <div className="aviso exito" role="status">
          <p>
            Número de radicado: <strong>{enviada.radicado}</strong>
          </p>
          <p style={{ margin: 0 }}>Recibida el {formatoFechaHora(enviada.recibidaEn)}.</p>
        </div>
        <p>
          Le avisaremos por correo cuando tenga respuesta. Puede ver su estado en «Mis consultas».
        </p>
        <div className="fila">
          <Link className="boton" to="/cuenta/consultas">
            Ver mis consultas
          </Link>
          <Link to="/">Volver al inicio</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="formulario">
      <h1>Enviar una consulta</h1>
      <p className="suave">
        Cuéntenos su caso. Un director lo revisará y le responderá aquí. Antes de enviarla, mire si
        alguna respuesta publicada ya la resuelve.
      </p>
      <AvisoError mensaje={error} />
      <form onSubmit={enviar} noValidate>
        <Campo nombre="categoriaId" etiqueta="Categoría" error={f.errores.categoriaId}>
          <select {...f.campo('categoriaId')}>
            <option value="">Seleccione…</option>
            {categorias.datos?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          nombre="asunto"
          etiqueta="Asunto"
          error={f.errores.asunto}
          ayuda="En una frase, ¿cuál es su duda?"
        >
          <input {...f.campo('asunto')} maxLength={200} autoComplete="off" />
        </Campo>
        {sugerencias.length > 0 && (
          <aside className="aviso info" aria-live="polite" aria-labelledby="sugerencias-titulo">
            <p id="sugerencias-titulo">
              <strong>¿Alguna de estas respuestas resuelve su duda?</strong>
            </p>
            <ul className="lista-simple">
              {sugerencias.map((s) => (
                <li key={s.id}>
                  <Link to={`/fichas/${s.id}`} target="_blank" rel="noopener">
                    {s.titulo}
                  </Link>{' '}
                  <span className="pequeno suave">· {formatoPrecio(s.precio)}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <Campo
          nombre="descripcion"
          etiqueta="Descripción"
          error={f.errores.descripcion}
          ayuda="Incluya fechas, valores y lo que necesita saber. No incluya datos sensibles."
        >
          <textarea {...f.campo('descripcion')} rows={7} maxLength={5000} />
        </Campo>
        <SelectorArchivo id="adjunto" etiqueta="Adjunto (opcional)" alElegir={setAdjunto} />
        <button className="boton" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Enviando…' : 'Enviar consulta'}
        </button>
      </form>
    </section>
  );
}
