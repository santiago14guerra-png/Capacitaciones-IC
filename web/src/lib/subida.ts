import { LIMITES, TIPOS_ARCHIVO, type SubidaDto } from '@ic/shared';
import { api } from './api';

/** Validación previa en el navegador; la política de la URL prefirmada la vuelve a aplicar. */
export function errorArchivo(f: File): string | null {
  if (!(TIPOS_ARCHIVO as readonly string[]).includes(f.type))
    return 'Solo se aceptan archivos JPG, PNG o PDF.';
  if (f.size > LIMITES.archivoMaxBytes) return 'El archivo supera 5 MB.';
  if (f.size === 0) return 'El archivo está vacío.';
  return null;
}

/** Pide la URL a la API y sube directo al bucket privado. Devuelve la llave. */
export async function subirArchivo(rutaSubida: string, archivo: File): Promise<string> {
  const s = await api<SubidaDto>(rutaSubida, {
    cuerpo: { nombre: archivo.name, tipo: archivo.type, tamano: archivo.size },
  });
  const f = new FormData();
  for (const [k, v] of Object.entries(s.campos)) f.append(k, v);
  f.append('file', archivo);
  const r = await fetch(s.url, { method: 'POST', body: f });
  if (!r.ok)
    throw new Error(
      'No se pudo subir el archivo. Verifique que sea JPG, PNG o PDF de máximo 5 MB.',
    );
  return s.llave;
}

export async function abrirArchivo(ruta: string) {
  const { url } = await api<{ url: string }>(ruta);
  window.open(url, '_blank', 'noopener');
}
