export function Paginacion({
  pagina,
  total,
  ir,
}: {
  pagina: number;
  total: number;
  ir(p: number): void;
}) {
  if (total <= 1) return null;
  return (
    <nav className="fila paginacion" aria-label="Paginación">
      <button
        className="boton secundario pequeno"
        type="button"
        disabled={pagina <= 1}
        onClick={() => ir(pagina - 1)}
      >
        ← Anterior
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          className={`boton pequeno ${p === pagina ? '' : 'secundario'}`}
          aria-current={p === pagina ? 'page' : undefined}
          aria-label={`Página ${p}`}
          onClick={() => ir(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="boton secundario pequeno"
        type="button"
        disabled={pagina >= total}
        onClick={() => ir(pagina + 1)}
      >
        Siguiente →
      </button>
    </nav>
  );
}
