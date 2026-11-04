import type { CategoriaAdminDto } from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { AvisoError, Campo } from '../../componentes/Campo';
import { api, ErrorApi } from '../../lib/api';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';
import { useAccion } from '../../lib/accion';

/** HU-07: crear, renombrar, ordenar, activar y desactivar categorías. */
export default function Categorias() {
  const { datos, setDatos, error, cargando, recargar } = useCarga(
    (s) => api<CategoriaAdminDto[]>('/admin/categorias', { senal: s }),
    [],
  );
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string>();
  const [aviso, setAviso] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string; nombre: string } | null>(null);
  const [bloqueo, setBloqueo] = useState<{ categoria: CategoriaAdminDto; mensaje: string } | null>(
    null,
  );
  const [destino, setDestino] = useState('');

  const accionInterno = async (f: () => Promise<unknown>) => {
    setAviso(null);
    try {
      await f();
      recargar();
      return true;
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Ocurrió un error');
      return false;
    }
  };

  const crearInterno = async (e: FormEvent) => {
    e.preventDefault();
    setErrorNombre(undefined);
    try {
      await api('/admin/categorias', { cuerpo: { nombre } });
      setNombre('');
      recargar();
    } catch (err) {
      setErrorNombre(
        err instanceof ErrorApi ? (err.campos.nombre ?? err.message) : 'Ocurrió un error',
      );
    }
  };

  const moverInterno = async (indice: number, delta: -1 | 1) => {
    if (!datos) return;
    const ids = datos.map((c) => c.id);
    [ids[indice], ids[indice + delta]] = [ids[indice + delta]!, ids[indice]!];
    const anterior = datos;
    setDatos(ids.map((id) => datos.find((c) => c.id === id)!));
    try {
      setDatos(
        await api<CategoriaAdminDto[]>('/admin/categorias/orden', {
          metodo: 'PUT',
          cuerpo: { ids },
        }),
      );
    } catch (err) {
      setDatos(anterior);
      setAviso(err instanceof Error ? err.message : 'No se pudo ordenar');
    }
  };

  const desactivarInterno = async (c: CategoriaAdminDto) => {
    setAviso(null);
    try {
      await api(`/admin/categorias/${c.id}/desactivar`, { cuerpo: {} });
      recargar();
    } catch (err) {
      if (err instanceof ErrorApi && err.codigo === 'CONFLICTO') {
        setBloqueo({ categoria: c, mensaje: err.message });
        setDestino('');
      } else setAviso(err instanceof Error ? err.message : 'Ocurrió un error');
    }
  };

  const reasignarYDesactivarInterno = async () => {
    if (!bloqueo || !destino) return;
    const ok = await accionInterno(async () => {
      await api(`/admin/categorias/${bloqueo.categoria.id}/reasignar`, {
        cuerpo: { destinoId: destino },
      });
      await api(`/admin/categorias/${bloqueo.categoria.id}/desactivar`, { cuerpo: {} });
    });
    if (ok) setBloqueo(null);
  };

  // Un solo bloqueo para toda la página: un doble clic no crea, mueve ni desactiva dos veces.
  const [hacer, ocupado] = useAccion((f: () => unknown) => f());
  const accion = (f: () => Promise<unknown>) => hacer(() => accionInterno(f));
  const crear = (e: FormEvent) => {
    e.preventDefault();
    return hacer(() => crearInterno(e));
  };
  const mover = (i: number, d: -1 | 1) => hacer(() => moverInterno(i, d));
  const desactivar = (c: CategoriaAdminDto) => hacer(() => desactivarInterno(c));
  const reasignarYDesactivar = () => hacer(() => reasignarYDesactivarInterno());

  if (cargando && !datos) return <Cargando />;
  return (
    <section className="pila" aria-busy={ocupado}>
      <h1>Categorías</h1>
      <p className="suave">El orden de esta lista es el mismo del inicio y del catálogo.</p>
      <AvisoError mensaje={error?.message ?? aviso} />

      <form onSubmit={crear} className="fila" style={{ alignItems: 'flex-end' }} noValidate>
        <div style={{ flex: '1 1 260px' }}>
          <Campo nombre="nueva-categoria" etiqueta="Nueva categoría" error={errorNombre}>
            <input
              id="nueva-categoria"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-invalid={errorNombre ? true : undefined}
            />
          </Campo>
        </div>
        <button
          className="boton"
          type="submit"
          disabled={!nombre.trim()}
          style={{ marginBottom: '1.1rem' }}
        >
          Crear
        </button>
      </form>

      {bloqueo && (
        <div className="aviso info" role="alertdialog" aria-labelledby="bloqueo-titulo">
          <p id="bloqueo-titulo">
            <strong>No se puede desactivar «{bloqueo.categoria.nombre}».</strong> {bloqueo.mensaje}
          </p>
          <div className="fila">
            <label htmlFor="destino">Reasignar sus fichas a</label>
            <select
              id="destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">Seleccione…</option>
              {datos
                ?.filter((c) => c.activa && c.id !== bloqueo.categoria.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
            </select>
            <button
              className="boton pequeno"
              type="button"
              disabled={!destino}
              onClick={reasignarYDesactivar}
            >
              Reasignar y desactivar
            </button>
            <button className="enlace-boton" type="button" onClick={() => setBloqueo(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              <th scope="col">Orden</th>
              <th scope="col">Nombre</th>
              <th scope="col">Fichas publicadas</th>
              <th scope="col">Estado</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos?.map((c, i) => (
              <tr key={c.id}>
                <td>
                  <div className="fila" style={{ gap: '0.25rem', flexWrap: 'nowrap' }}>
                    <button
                      className="boton secundario pequeno"
                      type="button"
                      disabled={i === 0}
                      onClick={() => mover(i, -1)}
                      aria-label={`Subir ${c.nombre}`}
                    >
                      ↑
                    </button>
                    <button
                      className="boton secundario pequeno"
                      type="button"
                      disabled={i === datos.length - 1}
                      onClick={() => mover(i, 1)}
                      aria-label={`Bajar ${c.nombre}`}
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td>
                  {editando?.id === c.id ? (
                    <form
                      className="fila"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void hacer(async () => {
                          const ok = await accionInterno(() =>
                            api(`/admin/categorias/${c.id}`, {
                              metodo: 'PUT',
                              cuerpo: { nombre: editando.nombre },
                            }),
                          );
                          if (ok) setEditando(null);
                        });
                      }}
                    >
                      <input
                        aria-label={`Nuevo nombre de ${c.nombre}`}
                        value={editando.nombre}
                        onChange={(e) => setEditando({ id: c.id, nombre: e.target.value })}
                        style={{ width: 'auto', flex: 1 }}
                      />
                      <button className="boton pequeno" type="submit">
                        Guardar
                      </button>
                    </form>
                  ) : (
                    c.nombre
                  )}
                </td>
                <td>{c.fichasPublicadas}</td>
                <td>
                  <span className={`estado ${c.activa ? 'verde' : ''}`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td>
                  <div className="fila" style={{ gap: '0.5rem' }}>
                    <button
                      className="enlace-boton"
                      type="button"
                      onClick={() => setEditando({ id: c.id, nombre: c.nombre })}
                    >
                      Renombrar
                    </button>
                    {c.activa ? (
                      <button className="enlace-boton" type="button" onClick={() => desactivar(c)}>
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="enlace-boton"
                        type="button"
                        onClick={() =>
                          accion(() => api(`/admin/categorias/${c.id}/activar`, { cuerpo: {} }))
                        }
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
