import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AvisoError, Campo } from '../componentes/Campo';
import { MENSAJES_AUTH } from '../lib/autenticacion/tipos';
import { rutaSegura, useSesion } from '../lib/sesion';
import { useAccion } from '../lib/accion';
import { BotonAccion } from '../componentes/BotonAccion';

/** Para quien se registró pero no alcanzó a escribir el código. */
export default function ConfirmarCuenta() {
  const { autenticador } = useSesion();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState(params.get('correo') ?? '');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const volver = rutaSegura(params.get('volver'));

  const [enviar, activando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    try {
      await autenticador.transporte.confirmar(correo.trim().toLowerCase(), codigo.trim());
      navegar(
        `/ingresar?correo=${encodeURIComponent(correo)}&volver=${encodeURIComponent(volver)}`,
        {
          replace: true,
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : MENSAJES_AUTH.DESCONOCIDO);
    }
  });

  return (
    <section className="formulario">
      <h1>Activar mi cuenta</h1>
      <AvisoError mensaje={error} />
      <form onSubmit={enviar} noValidate>
        <Campo nombre="correo" etiqueta="Correo electrónico">
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </Campo>
        <Campo nombre="codigo" etiqueta="Código de verificación">
          <input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </Campo>
        <div className="fila">
          <button className="boton" type="submit" disabled={activando} aria-busy={activando}>
            {activando ? 'Activando…' : 'Activar cuenta'}
          </button>
          <BotonAccion
            ocupadoTexto="Enviando…"
            className="enlace-boton"
            alPulsar={() => autenticador.transporte.reenviarCodigo(correo.trim().toLowerCase())}
          >
            Enviar otro código
          </BotonAccion>
        </div>
      </form>
    </section>
  );
}
