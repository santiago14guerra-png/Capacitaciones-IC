import { Link } from 'react-router';
import { useSesion } from '../../lib/sesion';

/** Secciones de la cuenta del cliente. Cada historia agrega la suya. */
export const SECCIONES_CUENTA: { ruta: string; nombre: string; descripcion: string }[] = [
  {
    ruta: '/cuenta/biblioteca',
    nombre: 'Mi biblioteca',
    descripcion: 'Las respuestas que compró y sus pagos en curso.',
  },
];

export default function MiCuenta() {
  const { sesion } = useSesion();
  return (
    <section className="pila">
      <h1>Mi cuenta</h1>
      <p className="suave">
        {sesion?.perfil ? `${sesion.perfil.nombres} ${sesion.perfil.apellidos} · ` : ''}
        {sesion?.correo}
      </p>
      <div className="rejilla">
        {SECCIONES_CUENTA.map((s) => (
          <Link key={s.ruta} to={s.ruta} className="tarjeta" style={{ textDecoration: 'none' }}>
            <h2 style={{ fontSize: '1.15rem' }}>{s.nombre}</h2>
            <p className="suave" style={{ margin: 0 }}>
              {s.descripcion}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
