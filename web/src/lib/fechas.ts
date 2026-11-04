/** Fecha local aaaa-mm-dd para los campos type="date". */
export const hoyLocal = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return z.toISOString().slice(0, 10);
};
export const inicioDeMes = (d = new Date()) => hoyLocal(new Date(d.getFullYear(), d.getMonth(), 1));
