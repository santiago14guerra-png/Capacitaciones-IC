import type { CategoriaDto } from '@ic/shared';

export type Categoria = CategoriaDto;

/**
 * HU-07 CA3: carga inicial propuesta por el equipo. Queda pendiente validarla con la
 * directora; se puede cambiar desde el panel sin tocar código.
 */
export const CATEGORIAS_INICIALES = [
  'Arrendamientos',
  'Pensionados',
  'Asalariados e independientes',
  'Sucesiones y herencias',
  'Patrimonio y bienes',
  'Declaración de renta',
  'Obligaciones con la DIAN',
];

/** HU-07 CA4: el mismo orden en el panel, el inicio y el catálogo. */
export const ordenarCategorias = <T extends Pick<Categoria, 'orden' | 'nombre'>>(cs: T[]) =>
  [...cs].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
