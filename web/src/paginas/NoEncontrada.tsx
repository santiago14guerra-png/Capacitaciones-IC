import { Link } from 'react-router';

export default function NoEncontrada() {
  return (
    <section className="pila">
      <h1>No encontramos esta página</h1>
      <p>Es posible que el enlace haya cambiado.</p>
      <Link className="boton" to="/">
        Ir al inicio
      </Link>
    </section>
  );
}
