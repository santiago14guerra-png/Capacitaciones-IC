import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { useRevelar } from '../lib/revelar';
import { useSesion } from '../lib/sesion';
import { Contacto } from './Contacto';
import { Logo } from './Logo';
import { BotonAccion } from './BotonAccion';

function MenuUsuario() {
  const { sesion, cargando, salir, esPersonal } = useSesion();
  const navegar = useNavigate();
  if (cargando) return null;
  if (!sesion) {
    return (
      <>
        <NavLink to="/ingresar">Ingresar</NavLink>
        <Link className="boton pequeno" to="/registro">
          Crear cuenta
        </Link>
      </>
    );
  }
  const nombre = sesion.perfil?.nombres ?? sesion.correo;
  return (
    <>
      {esPersonal && <NavLink to="/panel">Panel</NavLink>}
      <NavLink to="/cuenta" title="Mi cuenta">
        {nombre}
      </NavLink>
      <BotonAccion
        ocupadoTexto="Cerrando…"
        className="enlace-boton"
        alPulsar={async () => {
          await salir();
          navegar('/', { replace: true });
        }}
      >
        Cerrar sesión
      </BotonAccion>
    </>
  );
}

function useDesplazado() {
  const [desplazado, setDesplazado] = useState(false);
  useEffect(() => {
    const revisar = () => setDesplazado(window.scrollY > 8);
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
    return () => window.removeEventListener('scroll', revisar);
  }, []);
  return desplazado;
}

export function Diseno() {
  const { pathname } = useLocation();
  const desplazado = useDesplazado();
  useRevelar(useCallback(() => document.getElementById('contenido'), []));
  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <header className={`encabezado${desplazado ? ' desplazado' : ''}`}>
        <div className="contenedor">
          <Link
            to="/"
            className="logo"
            aria-label="Capacitaciones IC · Respuestas para Personas Naturales, inicio"
          >
            <Logo className="logo-marca" />
            <span className="logo-texto" aria-hidden="true">
              Respuestas para
              <br />
              Personas Naturales
            </span>
          </Link>
          <nav className="nav" aria-label="Principal">
            <NavLink to="/catalogo">Catálogo</NavLink>
            <NavLink to="/consultas/nueva">Consultar</NavLink>
            <NavLink to="/tarifas">Tarifas</NavLink>
            <MenuUsuario />
          </nav>
        </div>
      </header>
      <main id="contenido">
        <div className="contenedor entrada-pagina" key={pathname}>
          <Outlet />
        </div>
      </main>
      <footer className="pie">
        <div className="contenedor">
          <div>
            <Logo className="pie-marca" />
            <p className="pequeno">Respuestas tributarias para personas naturales.</p>
          </div>
          <div>
            <strong>Contacto</strong>
            <Contacto claro />
          </div>
          <nav aria-label="Legal" className="pequeno">
            <Link to="/privacidad">Política de tratamiento de datos</Link>
            <br />
            <Link to="/terminos">Términos y condiciones</Link>
          </nav>
        </div>
      </footer>
      <ScrollRestoration />
    </>
  );
}
