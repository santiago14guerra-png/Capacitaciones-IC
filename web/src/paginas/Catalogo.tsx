import type { CategoriaDto, FichaResumenDto, Pagina } from '@ic/shared';
import { Link, useSearchParams } from 'react-router';
import { AvisoError } from '../componentes/Campo';
import { Esqueletos } from '../componentes/Esqueletos';
import { Paginacion } from '../componentes/Paginacion';
import { TarjetaFicha } from '../componentes/TarjetaFicha';
import { api } from '../lib/api';
import { useCarga } from '../lib/useCarga';

/** HU-08: catálogo público con filtro por categorías, orden y paginación. */
export default function Catalogo() {
  const [params, setParams] = useSearchParams();
  const elegidas = params.getAll('categoria');
  const orden = params.get('orden') === 'precio' ? 'precio' : 'recientes';
  const categorias = useCarga((s) => api<CategoriaDto[]>('/categorias', { senal: s }), []);
  const fichas = useCarga(
    (s) => api<Pagina<FichaResumenDto>>(`/fichas?${params.toString()}`, { senal: s }),
    [params.toString()],
  );

  const cambiar = (f: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(params);
    f(p);
    p.delete('pagina');
    setParams(p);
  };
  const alternar = (id: string) =>
    cambiar((p) => {
      p.delete('categoria');
      const nuevas = elegidas.includes(id) ? elegidas.filter((c) => c !== id) : [...elegidas, id];
      nuevas.forEach((c) => p.append('categoria', c));
    });

  return (
    <section className="catalogo">
      <h1>Catálogo de respuestas</h1>
      <div className="catalogo-cuerpo">
        <aside aria-labelledby="filtros-titulo" className="catalogo-filtros">
          <h2 id="filtros-titulo" className="ficha-subtitulo">
            Categorías
          </h2>
          {categorias.datos?.map((c) => (
            <label key={c.id} className="casilla" style={{ marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                checked={elegidas.includes(c.id)}
                onChange={() => alternar(c.id)}
              />
              {c.nombre}
            </label>
          ))}
          {elegidas.length > 0 && (
            <button
              className="enlace-boton"
              type="button"
              onClick={() => cambiar((p) => p.delete('categoria'))}
            >
              Quitar filtros
            </button>
          )}
        </aside>
        <div className="pila">
          <div className="fila entre">
            <p className="suave" style={{ margin: 0 }} aria-live="polite">
              {fichas.datos
                ? `${fichas.datos.total} ${fichas.datos.total === 1 ? 'respuesta' : 'respuestas'}`
                : ''}
            </p>
            <label className="fila" style={{ gap: '0.5rem' }}>
              Ordenar por
              <select
                value={orden}
                onChange={(e) => cambiar((p) => p.set('orden', e.target.value))}
                style={{ width: 'auto' }}
              >
                <option value="recientes">Más recientes</option>
                <option value="precio">Precio</option>
              </select>
            </label>
          </div>
          <AvisoError mensaje={fichas.error?.message} />
          {fichas.cargando && !fichas.datos && <Esqueletos />}
          {fichas.datos?.total === 0 && (
            <div className="tarjeta pila" role="status">
              <h2>No encontramos respuestas con estos filtros</h2>
              <p>Pruebe con otras categorías o envíenos su caso y un director le responde.</p>
              <Link className="boton" to="/consultas/nueva">
                Enviar mi consulta
              </Link>
            </div>
          )}
          <div className="rejilla">
            {fichas.datos?.elementos.map((f) => (
              <TarjetaFicha key={f.id} ficha={f} />
            ))}
          </div>
          {fichas.datos && (
            <Paginacion
              pagina={fichas.datos.pagina}
              total={fichas.datos.totalPaginas}
              ir={(n) => {
                const p = new URLSearchParams(params);
                p.set('pagina', String(n));
                setParams(p);
                window.scrollTo(0, 0);
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
