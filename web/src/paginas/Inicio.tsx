import { LIMITES, type CategoriaDto, type FichaResumenDto, type Pagina } from '@ic/shared';
import { Link } from 'react-router';
import { Buscador } from '../componentes/Buscador';
import { TarjetaFicha } from '../componentes/TarjetaFicha';
import { api } from '../lib/api';
import { useCarga } from '../lib/useCarga';

const PASOS = [
  { titulo: 'Busque su caso', texto: 'Escriba su duda con sus palabras o explore las categorías.' },
  {
    titulo: 'Obtenga la respuesta',
    texto: 'Pague por transferencia y lea la respuesta completa en su cuenta.',
  },
  {
    titulo: '¿No está? Pregúntenos',
    texto: 'Envíe su consulta y un director la responde en la plataforma.',
  },
];

/** HU-01: propuesta de valor, buscador, cómo funciona, categorías y fichas recientes. */
export default function Inicio() {
  const categorias = useCarga((s) => api<CategoriaDto[]>('/categorias', { senal: s }), []);
  const recientes = useCarga(
    (s) => api<Pagina<FichaResumenDto>>('/fichas?orden=recientes', { senal: s }),
    [],
  );

  return (
    <div className="inicio">
      {/* CA1: nombre, propuesta de valor y buscador sin desplazarse. */}
      <section className="heroe">
        <p className="heroe-marca">Capacitaciones IC</p>
        <h1>Respuestas para Personas Naturales</h1>
        <p className="heroe-frase">
          Respuestas claras a sus dudas tributarias, escritas por los directores de Capacitaciones
          IC. Encuéntrelas aquí antes de escribirnos.
        </p>
        <Buscador grande />
      </section>

      <section aria-labelledby="como-funciona" className="seccion">
        <h2 id="como-funciona">Cómo funciona</h2>
        <ol className="pasos">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="tarjeta">
              <span className="paso-numero" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {!!categorias.datos?.length && (
        <section aria-labelledby="temas" className="seccion">
          <h2 id="temas">Temas</h2>
          <ul className="categorias-inicio">
            {categorias.datos.map((c) => (
              <li key={c.id}>
                <Link
                  className="boton secundario"
                  to={`/catalogo?categoria=${encodeURIComponent(c.id)}`}
                >
                  {c.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!recientes.datos?.elementos.length && (
        <section aria-labelledby="recientes" className="seccion">
          <div className="fila entre">
            <h2 id="recientes" style={{ margin: 0 }}>
              Respuestas recientes
            </h2>
            <Link to="/catalogo">Ver todo el catálogo →</Link>
          </div>
          <div className="rejilla" style={{ marginTop: '1rem' }}>
            {recientes.datos.elementos.slice(0, LIMITES.fichasRecientes).map((f) => (
              <TarjetaFicha key={f.id} ficha={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
