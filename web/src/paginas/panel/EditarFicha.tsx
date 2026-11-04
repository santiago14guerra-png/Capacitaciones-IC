import { ETIQUETAS_ESTADO_FICHA, type CategoriaAdminDto, type FichaAdminDto } from '@ic/shared';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { FormularioFicha } from '../../componentes/FormularioFicha';
import { api } from '../../lib/api';
import { formatoFechaHora } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';
import { useAccion } from '../../lib/accion';

/** HU-06: editar, despublicar o eliminar (solo borradores nunca publicados). */
export default function EditarFicha() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { datos, setDatos, error } = useCarga(
    async (s) => {
      const [ficha, categorias] = await Promise.all([
        api<FichaAdminDto>(`/admin/fichas/${id}`, { senal: s }),
        api<CategoriaAdminDto[]>('/admin/categorias', { senal: s }),
      ]);
      return {
        ficha,
        categorias: categorias.filter((c) => c.activa || c.id === ficha.categoriaId),
      };
    },
    [id],
  );
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  // Un solo bloqueo para despublicar y eliminar: un doble clic no repite la acción.
  const [ejecutar, ocupado] = useAccion(async (f: () => Promise<void>) => {
    try {
      await f();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e instanceof Error ? e.message : 'Ocurrió un error' });
    }
  });
  if (!datos) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  const { ficha, categorias } = datos;
  const actualizar = (f: FichaAdminDto, texto: string) => {
    setDatos({ ficha: f, categorias });
    setAviso({ tipo: 'exito', texto });
    window.scrollTo(0, 0);
  };

  return (
    <section className="pila">
      <p>
        <Link to="/panel/fichas">← Fichas</Link>
      </p>
      <h1>Editar ficha</h1>
      <p className="suave pequeno">
        Estado: <strong>{ETIQUETAS_ESTADO_FICHA[ficha.estado]}</strong> · Creada{' '}
        {formatoFechaHora(ficha.creadaEn)} · Actualizada {formatoFechaHora(ficha.actualizadaEn)}
      </p>
      {aviso && (
        <div className={`aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          {aviso.texto}
        </div>
      )}
      <FormularioFicha
        key={ficha.actualizadaEn}
        ficha={ficha}
        categorias={categorias}
        alGuardar={async (d) =>
          actualizar(
            await api<FichaAdminDto>(`/admin/fichas/${ficha.id}`, { metodo: 'PUT', cuerpo: d }),
            'Cambios guardados.',
          )
        }
        acciones={
          <>
            {ficha.estado === 'PUBLICADA' && (
              <button
                type="button"
                className="boton secundario"
                disabled={ocupado}
                aria-busy={ocupado}
                onClick={() =>
                  ejecutar(async () =>
                    actualizar(
                      await api<FichaAdminDto>(`/admin/fichas/${ficha.id}/despublicar`, {
                        cuerpo: {},
                      }),
                      'La ficha ya no aparece en el catálogo. Quienes la compraron la conservan.',
                    ),
                  )
                }
              >
                Despublicar
              </button>
            )}
            {ficha.estado === 'BORRADOR' && !ficha.publicadaAlgunaVez && (
              <button
                type="button"
                className="boton peligro"
                onClick={() => setConfirmarBorrado(true)}
              >
                Eliminar
              </button>
            )}
          </>
        }
      />
      {confirmarBorrado && (
        <div className="aviso error" role="alertdialog" aria-labelledby="borrar-titulo">
          <p id="borrar-titulo">¿Eliminar definitivamente este borrador? No se puede deshacer.</p>
          <div className="fila">
            <button
              type="button"
              className="boton peligro"
              disabled={ocupado}
              aria-busy={ocupado}
              onClick={() =>
                ejecutar(async () => {
                  await api(`/admin/fichas/${ficha.id}`, { metodo: 'DELETE' });
                  navegar('/panel/fichas', { replace: true });
                })
              }
            >
              Sí, eliminar
            </button>
            <button
              type="button"
              className="boton secundario"
              onClick={() => setConfirmarBorrado(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
