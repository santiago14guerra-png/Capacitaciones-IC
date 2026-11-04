import { useSesion } from '../../lib/sesion';

export default function MiCuenta() {
  const { sesion } = useSesion();
  return (
    <section className="pila">
      <h1>Mi cuenta</h1>
      <p className="suave">{sesion?.correo}</p>
    </section>
  );
}
