import { NavLink, Outlet } from 'react-router';
import { RequierePersonal } from '../../lib/sesion';

/** Secciones del panel. Cada historia agrega la suya. */
export const SECCIONES_PANEL: { ruta: string; nombre: string; descripcion: string }[] = [
  { ruta: 'pagos', nombre: 'Pagos', descripcion: 'Verificar comprobantes y habilitar el acceso.' },
  {
    ruta: 'consultas',
    nombre: 'Consultas',
    descripcion: 'Clasificar, responder o escalar las consultas.',
  },
  {
    ruta: 'fichas',
    nombre: 'Fichas',
    descripcion: 'Crear, editar, publicar y despublicar respuestas.',
  },
  {
    ruta: 'categorias',
    nombre: 'Categorías',
    descripcion: 'Crear, ordenar y desactivar categorías.',
  },
  {
    ruta: 'indicadores',
    nombre: 'Indicadores',
    descripcion: 'Consultas, tiempos, temas, búsquedas sin resultado y ventas.',
  },
  {
    ruta: 'siigo',
    nombre: 'Exportar a Siigo',
    descripcion: 'Excel con los datos fiscales de las compras verificadas.',
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
