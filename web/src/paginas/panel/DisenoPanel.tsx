import { NavLink, Outlet } from 'react-router';
import { RequierePersonal } from '../../lib/sesion';

/** Secciones del panel. Cada historia agrega la suya. */
export const SECCIONES_PANEL: { ruta: string; nombre: string; descripcion: string }[] = [
  {
    ruta: 'categorias',
    nombre: 'Categorías',
    descripcion: 'Crear, ordenar y desactivar categorías.',
  },
];

export default function DisenoPanel() {
  return (
    <RequierePersonal>
      <div className="panel">
        <nav className="panel-nav" aria-label="Panel">
          <NavLink to="/panel" end>
            Inicio
          </NavLink>
          {SECCIONES_PANEL.map((s) => (
            <NavLink key={s.ruta} to={`/panel/${s.ruta}`}>
              {s.nombre}
            </NavLink>
          ))}
        </nav>
        <div className="panel-contenido">
          <Outlet />
        </div>
      </div>
    </RequierePersonal>
  );
}
