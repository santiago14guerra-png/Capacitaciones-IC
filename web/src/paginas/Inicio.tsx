import { LIMITES, type CategoriaDto, type FichaResumenDto, type Pagina } from '@ic/shared';
import { Link } from 'react-router';
import { Buscador } from '../componentes/Buscador';
import { Esqueletos } from '../componentes/Esqueletos';
import { MonogramaIC } from '../componentes/Logo';
import { TarjetaFicha } from '../componentes/TarjetaFicha';
import { api } from '../lib/api';
import { useCarga } from '../lib/useCarga';

const CONFIANZA = [
  { titulo: 'Desde 2003', texto: 'Asesoría contable y tributaria, primero como IC Contables.' },
  {
    titulo: 'Escritas por los directores',
    texto: 'Cada respuesta la redacta la dirección de la firma.',
  },
  {
    titulo: 'Fechadas y con su norma',
    texto: 'Cada ficha indica hasta cuándo está vigente y en qué se apoya.',
  },
  {
    titulo: 'Pago por transferencia',
    texto: 'Sin pasarelas: adjunta el comprobante y le damos acceso.',
  },
];

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
        <MonogramaIC className="heroe-monograma" />
        <h1>Respuestas para Personas Naturales</h1>
        <p className="heroe-frase">
          Respuestas claras a sus dudas tributarias, escritas por los directores de Capacitaciones
          IC. Encuéntrelas aquí antes de escribirnos.
        </p>
        <Buscador grande />
      </section>

      {/* Hechos de la firma tomados de la Entrega 2; nada inventado. */}
      <ul className="confianza" aria-label="Por qué confiar en estas respuestas">
        {CONFIANZA.map((c) => (
          <li key={c.titulo} className="revelar">
            <strong>{c.titulo}</strong>
            <p>{c.texto}</p>
          </li>
        ))}
      </ul>

      <section aria-labelledby="como-funciona" className="seccion">
        <h2 id="como-funciona">Cómo funciona</h2>
        <ol className="pasos">
          {PASOS.map((p) => (
            <li key={p.titulo} className="tarjeta revelar">
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

      {recientes.cargando && !recientes.datos && <Esqueletos cantidad={3} />}
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
