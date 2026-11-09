import type { CompraAdminDto } from '@ic/shared';
import { useState } from 'react';
import { AvisoError } from '../../componentes/Campo';
import { EstadoCompra } from '../../componentes/EstadoCompra';
import { api } from '../../lib/api';
import { formatoFechaHora, formatoPrecio } from '../../lib/formato';
import { abrirArchivo } from '../../lib/subida';
import { useCarga } from '../../lib/useCarga';
import { useAccion } from '../../lib/accion';
import { BotonAccion } from '../../componentes/BotonAccion';

const VISTAS = [
  { estado: 'EN_VERIFICACION', nombre: 'Por verificar' },
  { estado: 'APROBADA', nombre: 'Aprobados' },
  { estado: 'RECHAZADA', nombre: 'Rechazados' },
] as const;

function Decision({ pago, alDecidir }: { pago: CompraAdminDto; alDecidir(): void }) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [decidir, decidiendo] = useAccion(async (cuerpo: object) => {
    setError(null);
    try {
      await api(`/admin/compras/${pago.id}`, { metodo: 'PATCH', cuerpo });
      alDecidir();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error');
    }
  });
  return (
    <div className="pila" style={{ minWidth: 220 }}>
      <AvisoError mensaje={error} />
      {!rechazando ? (
        <div className="fila" style={{ gap: '0.5rem' }}>
          <button
            className="boton pequeno"
            type="button"
            disabled={decidiendo}
            aria-busy={decidiendo}
            onClick={() => decidir({ decision: 'APROBAR' })}
          >
            Aprobar
          </button>
          <button
            className="boton secundario pequeno"
            type="button"
            onClick={() => setRechazando(true)}
          >
            Rechazar
          </button>
        </div>
      ) : (
        <div className="pila">
          <label htmlFor={`motivo-${pago.id}`}>Motivo (lo verá el cliente)</label>
          <textarea
            id={`motivo-${pago.id}`}
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            style={{ minHeight: 70 }}
          />
          <div className="fila" style={{ gap: '0.5rem' }}>
            <button
              className="boton peligro pequeno"
              type="button"
              disabled={!motivo.trim() || decidiendo}
              aria-busy={decidiendo}
              onClick={() => decidir({ decision: 'RECHAZAR', motivo })}
            >
              Confirmar rechazo
            </button>
            <button className="enlace-boton" type="button" onClick={() => setRechazando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** HU-13: una sola bandeja de pagos con su comprobante para aprobar o rechazar. */
export default function Pagos() {
  const [vista, setVista] = useState<(typeof VISTAS)[number]['estado']>('EN_VERIFICACION');
  const { datos, error, recargar } = useCarga(
    (s) => api<CompraAdminDto[]>(`/admin/compras?estado=${vista}`, { senal: s }),
    [vista],
  );
  const [aviso, setAviso] = useState<string | null>(null);
  return (
    <section className="pila">
      <h1>Pagos</h1>
      <div className="fila" role="tablist" aria-label="Estado de los pagos">
        {VISTAS.map((v) => (
          <button
            key={v.estado}
            role="tab"
            aria-selected={vista === v.estado}
            className={`boton pequeno ${vista === v.estado ? '' : 'secundario'}`}
            type="button"
            onClick={() => setVista(v.estado)}
          >
            {v.nombre}
          </button>
        ))}
      </div>
      <AvisoError mensaje={error?.message ?? aviso} />
      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              <th scope="col">Cliente</th>
              <th scope="col">Ficha</th>
              <th scope="col">Valor</th>
              <th scope="col">Referencia</th>
              <th scope="col">Comprobante</th>
              <th scope="col">{vista === 'EN_VERIFICACION' ? 'Decisión' : 'Estado'}</th>
            </tr>
          </thead>
          <tbody>
            {datos?.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.clienteNombre}
                  <br />
                  <span className="pequeno suave">{p.clienteCorreo}</span>
                </td>
                <td>{p.fichaTitulo}</td>
                <td>{formatoPrecio(p.valor)}</td>
                <td>
                  <strong>{p.referencia}</strong>
                </td>
                <td>
                  {p.tieneComprobante ? (
                    <BotonAccion
                      ocupadoTexto="Abriendo…"
                      className="enlace-boton"
                      alPulsar={() =>
                        abrirArchivo(`/admin/compras/${p.id}/comprobante`).catch((e) =>
                          setAviso(e.message),
                        )
                      }
                    >
                      Ver comprobante
                    </BotonAccion>
                  ) : (
                    '—'
                  )}
                  {p.comprobanteSubidoEn && (
                    <div className="pequeno suave">{formatoFechaHora(p.comprobanteSubidoEn)}</div>
                  )}
                </td>
                <td>
                  {vista === 'EN_VERIFICACION' ? (
                    <Decision pago={p} alDecidir={recargar} />
                  ) : (
                    <>
                      <EstadoCompra estado={p.estado} />
                      {p.decididaEn && (
                        <div className="pequeno suave">{formatoFechaHora(p.decididaEn)}</div>
                      )}
                      {p.motivoRechazo && <div className="pequeno">{p.motivoRechazo}</div>}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {datos?.length === 0 && (
              <tr>
                <td colSpan={6} className="suave">
                  {vista === 'EN_VERIFICACION'
                    ? 'No hay pagos por verificar.'
                    : 'No hay pagos en este estado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
