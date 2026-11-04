import { LIMITES, type ResultadoBusquedaDto } from '@ic/shared';
import { Link, useSearchParams } from 'react-router';
import { Buscador } from '../componentes/Buscador';
import { AvisoError } from '../componentes/Campo';
import { Esqueletos } from '../componentes/Esqueletos';
import { Resaltado } from '../componentes/Resaltado';
import { TarjetaFicha } from '../componentes/TarjetaFicha';
import { api } from '../lib/api';
import { useCarga } from '../lib/useCarga';

/** HU-09: resultados por relevancia con el término resaltado. */
export default function Buscar() {
  const [params] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const corta = q.length < LIMITES.terminoMin;
  const { datos, error, cargando } = useCarga(
    async (s) =>
      corta ? null : api<ResultadoBusquedaDto>(`/buscar?q=${encodeURIComponent(q)}`, { senal: s }),
    [q],
  );
  return (
    <section className="pila">
      <h1>Buscar respuestas</h1>
      <Buscador key={q} inicial={q} />
      {corta && (
        <p className="aviso info">Escriba al menos {LIMITES.terminoMin} letras para buscar.</p>
      )}
      <AvisoError mensaje={error?.message} />
      {cargando && !corta && <Esqueletos cantidad={3} />}
      {datos && (
        <>
          <p className="suave" aria-live="polite">
            {datos.total === 0
              ? `No encontramos respuestas para «${datos.consulta}».`
              : `${datos.total} ${datos.total === 1 ? 'respuesta' : 'respuestas'} para «${datos.consulta}», de la más relevante a la menos.`}
          </p>
          {datos.total === 0 && (
            <div className="tarjeta pila">
              <p>
                Pruebe con otras palabras o revise el{' '}
                <Link to="/catalogo">catálogo por categorías</Link>. Si no encuentra su caso,
                envíenos su consulta.
              </p>
              <Link className="boton" to="/consultas/nueva">
                Enviar mi consulta
              </Link>
            </div>
          )}
          <div className="rejilla">
            {datos.elementos.map((f) => (
              <TarjetaFicha
                key={f.id}
                ficha={f}
                titulo={<Resaltado texto={f.titulo} terminos={datos.terminos} />}
                resumen={<Resaltado texto={f.resumen} terminos={datos.terminos} />}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
