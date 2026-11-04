import { LIMITES } from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';

/** Caja de búsqueda (HU-09). Con menos de 3 letras no busca y lo indica (CA4). */
export function Buscador({ inicial = '', grande }: { inicial?: string; grande?: boolean }) {
  const [q, setQ] = useState(inicial);
  const [aviso, setAviso] = useState(false);
  const navegar = useNavigate();
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (q.trim().length < LIMITES.terminoMin) return setAviso(true);
    navegar(`/buscar?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form
      role="search"
      onSubmit={enviar}
      className={`buscador ${grande ? 'grande' : ''}`}
      noValidate
    >
      <label htmlFor="busqueda" className="oculto-visual">
        Escriba su duda
      </label>
      <div className="fila" style={{ flexWrap: 'nowrap' }}>
        <input
          id="busqueda"
          type="search"
          placeholder="Escriba su duda, por ejemplo: ¿debo declarar renta si soy pensionado?"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAviso(false);
          }}
          aria-describedby={aviso ? 'busqueda-aviso' : undefined}
        />
        <button className="boton" type="submit">
          Buscar
        </button>
      </div>
      {aviso && (
        <p id="busqueda-aviso" className="error-campo" role="alert">
          Escriba al menos {LIMITES.terminoMin} letras para buscar.
        </p>
      )}
    </form>
  );
}
