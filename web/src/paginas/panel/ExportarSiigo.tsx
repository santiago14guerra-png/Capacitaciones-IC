import { useState, type FormEvent } from 'react';
import { AvisoError, Campo } from '../../componentes/Campo';
import { descargar } from '../../lib/api';
import { hoyLocal, inicioDeMes } from '../../lib/fechas';

/** HU-19: descarga en Excel los datos fiscales de las compras verificadas en un periodo. */
export default function ExportarSiigo() {
  const [desde, setDesde] = useState(inicioDeMes());
  const [hasta, setHasta] = useState(hoyLocal());
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setDescargando(true);
    try {
      await descargar(
        `/admin/exportaciones/siigo?${new URLSearchParams({ desde, hasta })}`,
        `siigo-${desde}-a-${hasta}.xlsx`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar');
    } finally {
      setDescargando(false);
    }
  };
  return (
    <section className="pila formulario">
      <h1>Exportar para Siigo</h1>
      <p>
        Descarga un Excel con las compras <strong>verificadas</strong> en el periodo y los datos de
        facturación de cada cliente (hojas «Ventas» y «Terceros»).
      </p>
      <p className="aviso info">
        Formato provisional: falta validar con la directora la plantilla exacta de importación de
        Siigo.
      </p>
      <AvisoError mensaje={error} />
      <form onSubmit={enviar} className="dos-columnas" noValidate>
        <Campo nombre="desde" etiqueta="Desde">
          <input
            id="desde"
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
          />
        </Campo>
        <Campo nombre="hasta" etiqueta="Hasta">
          <input
            id="hasta"
            type="date"
            value={hasta}
            min={desde}
            onChange={(e) => setHasta(e.target.value)}
          />
        </Campo>
        <div>
          <button className="boton" type="submit" disabled={descargando || !desde || !hasta}>
            {descargando ? 'Generando…' : 'Descargar Excel'}
          </button>
        </div>
      </form>
    </section>
  );
}
