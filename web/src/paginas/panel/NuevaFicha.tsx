import type { CategoriaAdminDto, FichaAdminDto } from '@ic/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { FormularioFicha } from '../../componentes/FormularioFicha';
import { api } from '../../lib/api';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';

export default function NuevaFicha() {
  const { datos: categorias, error } = useCarga(
    async (s) =>
      (await api<CategoriaAdminDto[]>('/admin/categorias', { senal: s })).filter((c) => c.activa),
    [],
  );
  const [creada, setCreada] = useState<FichaAdminDto | null>(null);
  const [clave, setClave] = useState(0);

  if (!categorias) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  return (
    <section className="pila">
      <h1>Nueva ficha</h1>
      {creada && (
        <div className="aviso exito" role="status">
          <p>
            Se guardó «{creada.titulo || 'Sin título'}» como{' '}
            <strong>{creada.estado === 'PUBLICADA' ? 'publicada' : 'borrador'}</strong>.
          </p>
          <Link to={`/panel/fichas/${creada.id}`}>Abrir la ficha</Link>
        </div>
      )}
      <FormularioFicha
        key={clave}
        categorias={categorias}
        alGuardar={async (d) => {
          setCreada(await api<FichaAdminDto>('/admin/fichas', { cuerpo: d }));
          setClave((k) => k + 1);
          window.scrollTo(0, 0);
        }}
      />
    </section>
  );
}
