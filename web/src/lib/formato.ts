const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});
const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const fechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export const formatoPrecio = (valor: number) => (valor === 0 ? 'Gratis' : cop.format(valor));
export const formatoFecha = (iso: string) => fecha.format(new Date(iso));
export const formatoFechaHora = (iso: string) => fechaHora.format(new Date(iso));
