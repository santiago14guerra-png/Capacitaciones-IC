import { Link, NavLink, Outlet, ScrollRestoration, useNavigate } from 'react-router';
import { useSesion } from '../lib/sesion';
import { Contacto } from './Contacto';

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
      <button
        type="button"
        className="enlace-boton"
        onClick={async () => {
          await salir();
          navegar('/', { replace: true });
        }}
      >
        Cerrar sesión
      </button>
    </>
  );
}

export function Diseno() {
  return (
    <>
      <a className="saltar" href="#contenido">
        Saltar al contenido
      </a>
      <header className="encabezado">
        <div className="contenedor">
          <Link to="/" className="logo">
            Respuestas para Personas Naturales
            <small>Capacitaciones IC</small>
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
        <div className="contenedor">
          <Outlet />
        </div>
      </main>
      <footer className="pie">
        <div className="contenedor">
          <div>
            <strong>Capacitaciones IC</strong>
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
