import { esquemaContrasena } from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AvisoError, Campo } from '../componentes/Campo';
import { ErrorAuth, MENSAJES_AUTH } from '../lib/autenticacion/tipos';
import { useSesion } from '../lib/sesion';
import { useAccion } from '../lib/accion';

/**
 * HU-22: restablecer la contraseña con el enlace (o el código) que llega al correo.
 * No revela si un correo tiene cuenta.
 */
export default function Recuperar() {
  const { autenticador } = useSesion();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const [correo, setCorreo] = useState(params.get('correo') ?? '');
  const [codigo, setCodigo] = useState(params.get('codigo') ?? '');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [paso, setPaso] = useState<'correo' | 'nueva'>(params.get('codigo') ? 'nueva' : 'correo');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const normal = correo.trim().toLowerCase();

  const [pedir, pidiendo] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(normal)) return setErrores({ correo: 'Escriba un correo válido' });
    try {
      await autenticador.transporte.olvido(normal);
      setPaso('nueva');
    } catch (err) {
      setError(err instanceof ErrorAuth && err.codigo === 'LIMITE' ? err.message : null);
      // Por seguridad se avanza igual: no se revela si el correo existe.
      if (!(err instanceof ErrorAuth && err.codigo === 'LIMITE')) setPaso('nueva');
    }
  });

  const [restablecer, guardando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = esquemaContrasena.safeParse(clave);
    const errs: Record<string, string> = {};
    if (!codigo.trim()) errs.codigo = 'Escriba el código del correo';
    if (!r.success) errs.clave = r.error.issues[0]!.message;
    if (clave !== confirmacion) errs.confirmacion = 'Las contraseñas no coinciden';
    setErrores(errs);
    if (Object.keys(errs).length) return;
    try {
      await autenticador.transporte.restablecer(normal, codigo.trim(), clave);
      navegar(`/ingresar?correo=${encodeURIComponent(normal)}&restablecida=1`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : MENSAJES_AUTH.DESCONOCIDO);
    }
  });
  const enviando = pidiendo || guardando;

  return (
    <section className="formulario">
      <h1>Recuperar contraseña</h1>
      <AvisoError mensaje={error} />
      {paso === 'correo' ? (
        <form onSubmit={pedir} noValidate>
          <p>
            Escriba el correo de su cuenta y le enviaremos un enlace para crear una contraseña
            nueva.
          </p>
          <Campo nombre="correo" etiqueta="Correo electrónico" error={errores.correo}>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Campo>
          <button className="boton" type="submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      ) : (
        <form onSubmit={restablecer} noValidate>
          {!params.get('codigo') && (
            <p className="aviso info" role="status">
              Si <strong>{normal}</strong> tiene una cuenta, le enviamos un correo con un enlace y
              un código.
            </p>
          )}
          <Campo nombre="correo2" etiqueta="Correo electrónico">
            <input
              id="correo2"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Campo>
          <Campo nombre="codigo" etiqueta="Código del correo" error={errores.codigo}>
            <input
              id="codigo"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </Campo>
          <Campo
            nombre="clave"
            etiqueta="Contraseña nueva"
            error={errores.clave}
            ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
          >
            <input
              id="clave"
              type="password"
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </Campo>
          <Campo
            nombre="confirmacion"
            etiqueta="Confirmar contraseña nueva"
            error={errores.confirmacion}
          >
            <input
              id="confirmacion"
              type="password"
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
            />
          </Campo>
          <div className="fila">
            <button className="boton" type="submit" disabled={enviando} aria-busy={enviando}>
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
            <button type="button" className="enlace-boton" onClick={() => setPaso('correo')}>
              Pedir otro correo
            </button>
          </div>
        </form>
      )}
      <p style={{ marginTop: '2rem' }}>
        <Link to="/ingresar">Volver a ingresar</Link>
      </p>
    </section>
  );
}
