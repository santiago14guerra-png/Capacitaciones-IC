import {
  esquemaGuardarFicha,
  LIMITES,
  type CategoriaDto,
  type DatosFicha,
  type FichaAdminDto,
} from '@ic/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useFormulario } from '../lib/formulario';
import { Campo } from './Campo';
import { EditorTexto } from './EditorTexto';
import { HtmlSeguro } from './HtmlSeguro';
import { VistaFicha } from './VistaFicha';
import { useAccion } from '../lib/accion';

interface Valores extends Record<string, unknown> {
  titulo: string;
  pregunta: string;
  resumen: string;
  respuestaHtml: string;
  categoriaId: string;
  etiquetas: string;
  normas: string;
  precio: string;
  publicar: boolean;
}

const desdeFicha = (f?: FichaAdminDto): Valores => ({
  titulo: f?.titulo ?? '',
  pregunta: f?.pregunta ?? '',
  resumen: f?.resumen ?? '',
  respuestaHtml: f?.respuestaHtml ?? '',
  categoriaId: f?.categoriaId ?? '',
  etiquetas: f?.etiquetas.join(', ') ?? '',
  normas: f?.normas.join('\n') ?? '',
  precio: f?.precio == null ? '' : String(f.precio),
  publicar: f ? f.estado === 'PUBLICADA' : false,
});

const aDatos = (v: Valores) => ({
  titulo: v.titulo.trim(),
  pregunta: v.pregunta.trim(),
  resumen: v.resumen.trim(),
  respuestaHtml: v.respuestaHtml,
  categoriaId: v.categoriaId,
  etiquetas: v.etiquetas
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean),
  normas: v.normas
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean),
  precio: v.precio.trim() === '' ? null : Number(v.precio.replace(/[.\s$]/g, '')),
  publicar: v.publicar,
});

interface Props {
  ficha?: FichaAdminDto;
  categorias: CategoriaDto[];
  alGuardar(datos: DatosFicha): Promise<void>;
  acciones?: ReactNode;
}

/** HU-05 y HU-06: formulario de ficha con vista previa (CA6). */
export function FormularioFicha({ ficha, categorias, alGuardar, acciones }: Props) {
  const f = useFormulario<Valores>(desdeFicha(ficha));
  const [previa, setPrevia] = useState(false);
  const { campo, errores, valores, poner } = f;
  const categoria = categorias.find((c) => c.id === valores.categoriaId);

  const [enviar, enviando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    const datos = f.validar(esquemaGuardarFicha, aDatos(valores));
    if (!datos) return setPrevia(false);
    try {
      await alGuardar(datos);
    } catch (err) {
      if (!f.errorApi(err)) throw err;
    }
  });

  const contador = (n: number, max: number) => (
    <span className="contador" aria-live="polite">
      {n}/{max}
    </span>
  );

  if (previa) {
    const d = aDatos(valores);
    return (
      <div className="pila">
        <div className="aviso info fila entre" role="status">
          <span>Vista previa: así verá la ficha un cliente con acceso.</span>
          <button className="boton pequeno" type="button" onClick={() => setPrevia(false)}>
            Volver a editar
          </button>
        </div>
        <VistaFicha
          ficha={{
            ...d,
            categoriaNombre: categoria?.nombre ?? '',
            precio: d.precio ?? 0,
            vigenteA: new Date().toISOString(),
          }}
          respuesta={
            <HtmlSeguro className="respuesta-completa contenido-html" html={d.respuestaHtml} />
          }
        />
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="formulario" style={{ maxWidth: 820 }}>
      <Campo
        nombre="titulo"
        etiqueta="Título"
        error={errores.titulo}
        ayuda={contador(valores.titulo.length, LIMITES.tituloMax)}
      >
        <input {...campo('titulo')} maxLength={LIMITES.tituloMax} />
      </Campo>
      <Campo nombre="pregunta" etiqueta="Pregunta del caso" error={errores.pregunta}>
        <textarea {...campo('pregunta')} rows={4} />
      </Campo>
      <Campo
        nombre="resumen"
        etiqueta="Resumen público"
        error={errores.resumen}
        ayuda={
          <>Lo ve cualquier visitante. {contador(valores.resumen.length, LIMITES.resumenMax)}</>
        }
      >
        <textarea {...campo('resumen')} rows={3} maxLength={LIMITES.resumenMax} />
      </Campo>
      <div className="campo">
        <span className="etiqueta" id="respuesta-etiqueta">
          Respuesta completa
        </span>
        <span className="ayuda">
          Solo la ven quienes compran la ficha (o todos los usuarios con sesión si es gratuita).
        </span>
        <EditorTexto
          id="respuestaHtml"
          etiquetadoPor="respuesta-etiqueta"
          valor={valores.respuestaHtml}
          alCambiar={(html) => poner('respuestaHtml', html)}
          invalido={!!errores.respuestaHtml}
        />
        {errores.respuestaHtml && (
          <span className="error-campo" id="respuestaHtml-error">
            {errores.respuestaHtml}
          </span>
        )}
      </div>
      <div className="dos-columnas">
        <Campo nombre="categoriaId" etiqueta="Categoría" error={errores.categoriaId}>
          <select {...campo('categoriaId')}>
            <option value="">Seleccione…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          nombre="precio"
          etiqueta="Precio en COP"
          error={errores.precio}
          ayuda="Número entero. 0 = gratuita para usuarios con sesión."
        >
          <input {...campo('precio')} inputMode="numeric" />
        </Campo>
      </div>
      <Campo
        nombre="etiquetas"
        etiqueta="Etiquetas"
        error={errores.etiquetas}
        ayuda="Separadas por comas. Ayudan a encontrar la ficha."
      >
        <input {...campo('etiquetas')} />
      </Campo>
      <Campo
        nombre="normas"
        etiqueta="Normas de referencia"
        error={errores.normas}
        ayuda="Una por línea."
      >
        <textarea {...campo('normas')} rows={3} />
      </Campo>
      <fieldset className="campo" style={{ border: 0, padding: 0 }}>
        <legend className="etiqueta">Estado</legend>
        <label className="casilla">
          <input
            type="radio"
            name="estado"
            checked={!valores.publicar}
            onChange={() => poner('publicar', false)}
          />
          Borrador (ningún cliente la ve)
        </label>
        <label className="casilla">
          <input
            type="radio"
            name="estado"
            checked={valores.publicar}
            onChange={() => poner('publicar', true)}
          />
          Publicada (aparece en el catálogo y la búsqueda)
        </label>
      </fieldset>
      {Object.keys(errores).length > 0 && (
        <p className="aviso error" role="alert">
          Revise los campos marcados.
        </p>
      )}
      <div className="fila">
        <button className="boton" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
        <button className="boton secundario" type="button" onClick={() => setPrevia(true)}>
          Vista previa
        </button>
        {acciones}
      </div>
    </form>
  );
}
