import type { CompraDto, FichaDetalleDto } from '@ic/shared';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AvisoError } from '../componentes/Campo';
import { Contacto } from '../componentes/Contacto';
import { EstadoCompra } from '../componentes/EstadoCompra';
import { HtmlSeguro } from '../componentes/HtmlSeguro';
import { TarjetaFicha } from '../componentes/TarjetaFicha';
import { VistaFicha } from '../componentes/VistaFicha';
import { api, ErrorApi } from '../lib/api';
import { formatoPrecio } from '../lib/formato';
import { Cargando, useRutaIngreso, useSesion } from '../lib/sesion';
import { useTitulo } from '../lib/titulo';
import { useCarga } from '../lib/useCarga';

/** Lo que ve quien aún no tiene acceso: nunca recibe la respuesta (HU-10 CA2). */
export function BloqueBloqueado({ ficha, accion }: { ficha: FichaDetalleDto; accion: ReactNode }) {
  return (
    <div className="bloqueada pila">
      <p style={{ fontSize: '1.1rem' }}>
        <span aria-hidden="true">🔒 </span>
        <strong>La respuesta completa está disponible al obtener esta ficha.</strong>
      </p>
      {ficha.precio === 0 && <p>Es gratuita: solo necesita iniciar sesión.</p>}
      {accion}
    </div>
  );
}

/** Acción para obtener la respuesta: ingresar, o comprar por transferencia (HU-11). */
export function AccionObtener({ ficha }: { ficha: FichaDetalleDto }) {
  const { sesion } = useSesion();
  const ingreso = useRutaIngreso();
  const navegar = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  if (!sesion) {
    // HU-10 CA3: lleva a ingresar o registrarse y luego regresa a la misma ficha.
    return (
      <div className="fila" style={{ justifyContent: 'center' }}>
        <Link className="boton" to={ingreso}>
          Obtener respuesta
        </Link>
        <Link to={ingreso.replace('/ingresar', '/registro')}>Crear una cuenta</Link>
      </div>
    );
  }
  if (ficha.compra && ficha.compra.estado !== 'RECHAZADA') {
    return (
      <div className="pila">
        <p>
          Compra en curso · referencia <strong>{ficha.compra.referencia}</strong> ·{' '}
          <EstadoCompra estado={ficha.compra.estado} />
        </p>
        <Link className="boton" to={`/compras/${ficha.compra.id}`}>
          Ver datos de pago y comprobante
        </Link>
      </div>
    );
  }
  const comprar = async () => {
    setError(null);
    setEnviando(true);
    try {
      const compra = await api<CompraDto>(`/fichas/${ficha.id}/compra`, { cuerpo: {} });
      navegar(`/compras/${compra.id}`);
    } catch (e) {
      if (e instanceof ErrorApi && e.campos.perfil) {
        return navegar(`/cuenta/completar?volver=${encodeURIComponent(`/fichas/${ficha.id}`)}`);
      }
      setError(e instanceof Error ? e.message : 'Ocurrió un error');
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="pila">
      {ficha.compra?.estado === 'RECHAZADA' && (
        <p className="suave">Su pago anterior fue rechazado. Puede intentarlo de nuevo.</p>
      )}
      <AvisoError mensaje={error} />
      <button className="boton" type="button" onClick={comprar} disabled={enviando}>
        {enviando ? 'Preparando…' : `Comprar por transferencia · ${formatoPrecio(ficha.precio)}`}
      </button>
    </div>
  );
}

export default function DetalleFicha() {
  const { id } = useParams();
  const { sesion } = useSesion();
  const {
    datos: ficha,
    error,
    cargando,
  } = useCarga((s) => api<FichaDetalleDto>(`/fichas/${id}`, { senal: s }), [id, sesion?.sub]);
  useTitulo(ficha?.titulo);

  if (cargando && !ficha) return <Cargando />;
  if (error || !ficha) {
    return (
      <section className="pila">
        <AvisoError mensaje={error?.message ?? 'No encontramos esta respuesta'} />
        <Link to="/catalogo">Ir al catálogo</Link>
      </section>
    );
  }
  return (
    <div className="pila">
      <p>
        <Link to="/catalogo">← Catálogo</Link>
      </p>
      {ficha.enRevision && (
        <p className="aviso info" role="note">
          <strong>En revisión.</strong> Esta respuesta ya no está en el catálogo mientras se
          actualiza; la conserva porque la adquirió.
        </p>
      )}
      <VistaFicha
        ficha={ficha}
        respuesta={
          ficha.tieneAcceso && ficha.respuestaHtml !== undefined ? (
            <>
              <h2 className="ficha-subtitulo">Respuesta</h2>
              <HtmlSeguro
                className="respuesta-completa contenido-html"
                html={ficha.respuestaHtml}
              />
            </>
          ) : (
            <BloqueBloqueado ficha={ficha} accion={<AccionObtener ficha={ficha} />} />
          )
        }
        aviso={
          <div>
            <p style={{ margin: '0.4rem 0 0' }}>
              ¿Necesita una asesoría personalizada? Escríbanos:
            </p>
            <Contacto />
          </div>
        }
      />
      {ficha.relacionadas.length > 0 && (
        <section aria-labelledby="relacionadas" style={{ marginTop: '2rem' }}>
          <h2 id="relacionadas">Respuestas relacionadas</h2>
          <div className="rejilla">
            {ficha.relacionadas.map((f) => (
              <TarjetaFicha key={f.id} ficha={f} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
