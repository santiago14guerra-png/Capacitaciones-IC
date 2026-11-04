import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ErrorAuth, MENSAJES_AUTH } from '../lib/autenticacion/tipos';
import { rutaSegura, useSesion } from '../lib/sesion';
import { useAccion } from '../lib/accion';

export default function Ingresar() {
  const { autenticador, recargar } = useSesion();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const volver = rutaSegura(params.get('volver'));
  const [correo, setCorreo] = useState(params.get('correo') ?? '');
  const [clave, setClave] = useState('');
  const [nueva, setNueva] = useState('');
  const [desafio, setDesafio] = useState<string | null>(null);
  const [error, setError] = useState<{ codigo: string; mensaje: string } | null>(null);

  const terminar = async () => {
    await recargar();
    navegar(volver, { replace: true });
  };

  const [enviar, enviando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (desafio) {
        await autenticador.completarNuevaContrasena(correo, desafio, nueva);
        return await terminar();
      }
      const r = await autenticador.ingresar(correo, clave);
      if ('desafio' in r) setDesafio(r.sesion);
      else await terminar();
    } catch (err) {
      const codigo = err instanceof ErrorAuth ? err.codigo : 'DESCONOCIDO';
      setError({
        codigo,
        mensaje: err instanceof ErrorAuth ? err.message : MENSAJES_AUTH.DESCONOCIDO,
      });
    }
  });

  return (
    <section className="formulario">
      <h1>Ingresar</h1>
      {params.get('restablecida') && !error && (
        <p className="aviso exito" role="status">
          Su contraseña se cambió. Ingrese con la nueva.
        </p>
      )}
      {error && (
        <div className="aviso error" role="alert">
          <p>{error.mensaje}</p>
          {error.codigo === 'SIN_CONFIRMAR' && (
            <Link
              to={`/registro/confirmar?correo=${encodeURIComponent(correo)}&volver=${encodeURIComponent(volver)}`}
            >
              Activar mi cuenta
            </Link>
          )}
        </div>
      )}
      <form onSubmit={enviar} noValidate>
        {!desafio ? (
          <>
            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                autoComplete="username"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <div className="campo">
              <label htmlFor="clave">Contraseña</label>
              <input
                id="clave"
                type="password"
                autoComplete="current-password"
                required
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="campo">
            <p className="aviso info">Por seguridad, cree una contraseña nueva para su cuenta.</p>
            <label htmlFor="nueva">Contraseña nueva</label>
            <input
              id="nueva"
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
            />
            <span className="ayuda">Mínimo 8 caracteres, con al menos una letra y un número.</span>
          </div>
        )}
        <div className="fila">
          <button className="boton" type="submit" disabled={enviando} aria-busy={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
          <Link to="/recuperar">Olvidé mi contraseña</Link>
        </div>
      </form>
      <p className="suave" style={{ marginTop: '2rem' }}>
        ¿No tiene cuenta?{' '}
        <Link to={`/registro?volver=${encodeURIComponent(volver)}`}>Crear una cuenta</Link>
      </p>
    </section>
  );
}
