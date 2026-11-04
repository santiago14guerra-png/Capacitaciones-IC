import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';

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
        </div>
      </footer>
      <ScrollRestoration />
    </>
  );
}
