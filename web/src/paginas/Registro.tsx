import { esquemaRegistro } from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AvisoError, Campo } from '../componentes/Campo';
import {
  CamposFacturacion,
  facturacionVacia,
  type DatosFacturacion,
} from '../componentes/CamposFacturacion';
import { CasillaAutorizacion } from '../componentes/CasillaAutorizacion';
import { api } from '../lib/api';
import { ErrorAuth, MENSAJES_AUTH } from '../lib/autenticacion/tipos';
import { useFormulario } from '../lib/formulario';
import { rutaSegura, useSesion } from '../lib/sesion';
import { useAccion } from '../lib/accion';
import { BotonAccion } from '../componentes/BotonAccion';

interface DatosRegistro extends DatosFacturacion {
  correo: string;
  contrasena: string;
  confirmacion: string;
  autorizaDatos: boolean;
}

export default function Registro() {
  const { autenticador, recargar } = useSesion();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const volver = rutaSegura(params.get('volver'));
  const f = useFormulario<DatosRegistro>({
    ...facturacionVacia,
    correo: '',
    contrasena: '',
    confirmacion: '',
    autorizaDatos: false,
  });
  const [paso, setPaso] = useState<'datos' | 'codigo'>('datos');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const correoExiste = f.errores.correo === MENSAJES_AUTH.CORREO_EXISTE;

  const [enviarDatos, creando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const d = f.validar(esquemaRegistro);
    if (!d) return;
    try {
      await autenticador.transporte.registrar(d.correo.trim().toLowerCase(), d.contrasena);
      setPaso('codigo');
    } catch (err) {
      const c = err instanceof ErrorAuth ? err.codigo : 'DESCONOCIDO';
      if (c === 'CORREO_EXISTE') f.setErrores({ correo: MENSAJES_AUTH.CORREO_EXISTE });
      else if (c === 'CONTRASENA_DEBIL')
        f.setErrores({ contrasena: MENSAJES_AUTH.CONTRASENA_DEBIL });
      else setError(MENSAJES_AUTH[c]);
    }
  });

  const [confirmar, activando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const { correo, contrasena, confirmacion: _c, autorizaDatos, ...facturacion } = f.valores;
    const normal = correo.trim().toLowerCase();
    try {
      await autenticador.transporte.confirmar(normal, codigo.trim());
      // HU-02 CA6: la sesión se inicia, se guardan los datos y vuelve a la página de origen.
      await autenticador.ingresar(normal, contrasena);
      await api('/perfil', { metodo: 'PUT', cuerpo: { ...facturacion, autorizaDatos } });
      await recargar();
      navegar(volver, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : MENSAJES_AUTH.DESCONOCIDO);
    }
  });
  const enviando = creando || activando;

  if (paso === 'codigo') {
    return (
      <section className="formulario">
        <h1>Revise su correo</h1>
        <p>
          Enviamos un código de verificación a <strong>{f.valores.correo}</strong>. Escríbalo para
          activar su cuenta.
        </p>
        <AvisoError mensaje={error} />
        <form onSubmit={confirmar} noValidate>
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
            <button
              className="boton"
              type="submit"
              disabled={enviando || !codigo.trim()}
              aria-busy={enviando}
            >
              {enviando ? 'Activando…' : 'Activar cuenta'}
            </button>
            <BotonAccion
              ocupadoTexto="Enviando…"
              className="enlace-boton"
              alPulsar={() =>
                autenticador.transporte.reenviarCodigo(f.valores.correo.trim().toLowerCase())
              }
            >
              Enviar otro código
            </BotonAccion>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="formulario">
      <h1>Crear cuenta</h1>
      <p className="suave">
        Sus datos de facturación quedan guardados una sola vez. Todos los campos son obligatorios.
      </p>
      <AvisoError mensaje={error} />
      <form onSubmit={enviarDatos} noValidate>
        <CamposFacturacion f={f} />
        <Campo
          nombre="correo"
          etiqueta="Correo electrónico"
          error={correoExiste ? undefined : f.errores.correo}
        >
          <input {...f.campo('correo')} type="email" autoComplete="email" />
        </Campo>
        {correoExiste && (
          <p
            className="error-campo"
            id="correo-error"
            role="alert"
            style={{ marginTop: '-0.8rem' }}
          >
            Este correo ya tiene una cuenta.{' '}
            <Link
              to={`/ingresar?correo=${encodeURIComponent(f.valores.correo)}&volver=${encodeURIComponent(volver)}`}
            >
              Iniciar sesión
            </Link>
          </p>
        )}
        <div className="dos-columnas">
          <Campo
            nombre="contrasena"
            etiqueta="Contraseña"
            error={f.errores.contrasena}
            ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
          >
            <input {...f.campo('contrasena')} type="password" autoComplete="new-password" />
          </Campo>
          <Campo
            nombre="confirmacion"
            etiqueta="Confirmar contraseña"
            error={f.errores.confirmacion}
          >
            <input {...f.campo('confirmacion')} type="password" autoComplete="new-password" />
          </Campo>
        </div>
        <CasillaAutorizacion
          marcada={f.valores.autorizaDatos}
          alCambiar={(v) => f.poner('autorizaDatos', v)}
          error={f.errores.autorizaDatos}
        />
        <button
          className="boton"
          type="submit"
          disabled={!f.valores.autorizaDatos || enviando}
          aria-busy={enviando}
        >
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="suave" style={{ marginTop: '2rem' }}>
        ¿Ya tiene cuenta?{' '}
        <Link to={`/ingresar?volver=${encodeURIComponent(volver)}`}>Ingresar</Link>
      </p>
    </section>
  );
}
