import { esPendiente } from '@ic/shared';
import { Link } from 'react-router';
import { Pendiente } from './legal/Legal';
import { useConfigPublica } from '../lib/configPublica';
import { useTitulo } from '../lib/titulo';

const Valor = ({ valor }: { valor?: string }) =>
  !valor ? (
    <span className="suave">…</span>
  ) : esPendiente(valor) ? (
    <mark>{valor}</mark>
  ) : (
    <strong>{valor}</strong>
  );

/**
 * HU-24: qué cubre una consulta rápida, qué es una asesoría y cuánto cuesta cada una.
 * Objetivo 4: criterio explícito entre consulta puntual y asesoría. Las tarifas y el
 * detalle del criterio los define la empresa; mientras tanto se muestran como pendientes.
 */
export default function Tarifas() {
  const config = useConfigPublica();
  useTitulo('Tarifas y alcance');
  return (
    <section className="pila" style={{ maxWidth: 900 }}>
      <h1>Tarifas y alcance del servicio</h1>
      <p>
        Antes de pagar, conozca qué puede esperar. Primero busque si su caso ya tiene una{' '}
        <Link to="/catalogo">respuesta publicada</Link>: es la forma más rápida y económica.
      </p>
      <div className="dos-columnas" style={{ gap: '1rem' }}>
        <article className="tarjeta pila">
          <h2>Consulta rápida</h2>
          <p className="ficha-precio">
            <Valor valor={config?.tarifas.consultaRapida} />
          </p>
          <p>
            Una duda puntual que un director puede resolver por escrito, dentro de la plataforma.
          </p>
          <ul>
            <li>La envía con el formulario de consultas y recibe un número de radicado.</li>
            <li>La respuesta queda en «Mis consultas» y le avisamos por correo.</li>
            <li>
              Alcance detallado: <Pendiente>qué incluye y qué no, según los directores</Pendiente>
            </li>
          </ul>
        </article>
        <article className="tarjeta pila">
          <h2>Asesoría</h2>
          <p className="ficha-precio">
            <Valor valor={config?.tarifas.asesoria} />
          </p>
          <p>
            Un caso que requiere más análisis, revisión de documentos o acompañamiento
            personalizado.
          </p>
          <ul>
            <li>Si su consulta lo requiere, el director la escala a asesoría.</li>
            <li>En su cuenta verá las condiciones antes de aceptar.</li>
            <li>
              Alcance detallado:{' '}
              <Pendiente>qué incluye una asesoría, según los directores</Pendiente>
            </li>
          </ul>
        </article>
      </div>
      <section className="tarjeta pila">
        <h2>¿Cómo se decide si es consulta rápida o asesoría?</h2>
        <p>
          Un director revisa cada consulta y la clasifica. Si es una consulta rápida, la responde en
          la plataforma; si necesita más análisis, le explica las condiciones de la asesoría para
          que usted decida.
        </p>
        <p>
          Criterio: <Pendiente>criterio documentado por los directores (objetivo 4)</Pendiente>
        </p>
      </section>
      <div className="fila">
        <Link className="boton" to="/consultas/nueva">
          Enviar mi consulta
        </Link>
        <Link to="/catalogo">Ver respuestas publicadas</Link>
      </div>
    </section>
  );
}
