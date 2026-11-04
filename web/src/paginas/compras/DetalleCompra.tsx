import type { CompraDto } from '@ic/shared';
import { Link, useParams } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { DatoCopiable } from '../../componentes/Dato';
import { EstadoCompra } from '../../componentes/EstadoCompra';
import { api } from '../../lib/api';
import { formatoFechaHora, formatoPrecio } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';

/** HU-11: instrucciones de transferencia con referencia única. */
export default function DetalleCompra() {
  const { id } = useParams();
  const { datos: compra, error } = useCarga(
    (s) => api<CompraDto>(`/compras/${id}`, { senal: s }),
    [id],
  );
  if (!compra) return error ? <AvisoError mensaje={error.message} /> : <Cargando />;
  return (
    <section className="pila" style={{ maxWidth: 720 }}>
      <p>
        <Link to={`/fichas/${compra.fichaId}`}>← {compra.fichaTitulo}</Link>
      </p>
      <h1>Su compra</h1>
      <p className="fila">
        Estado: <EstadoCompra estado={compra.estado} />
        <span className="suave pequeno">Actualizada {formatoFechaHora(compra.actualizadaEn)}</span>
      </p>

      {compra.estado === 'APROBADA' && (
        <div className="aviso exito">
          <p>Su pago fue verificado. Ya puede leer la respuesta completa.</p>
          <Link className="boton" to={`/fichas/${compra.fichaId}`}>
            Leer la respuesta
          </Link>
        </div>
      )}
      {compra.estado === 'RECHAZADA' && (
        <div className="aviso error" role="alert">
          <p>
            <strong>El pago fue rechazado.</strong> Motivo: {compra.motivoRechazo}
          </p>
          <p>Puede volver a intentarlo desde la ficha; se generará una referencia nueva.</p>
        </div>
      )}

      {compra.datosBancarios && compra.estado !== 'RECHAZADA' && (
        <div className="tarjeta pila">
          <h2>Datos para la transferencia</h2>
          <ol className="pila" style={{ paddingLeft: '1.2rem' }}>
            <li>Transfiera el valor exacto desde su banco a esta cuenta.</li>
            <li>
              Escriba la <strong>referencia</strong> en la descripción de la transferencia.
            </li>
            <li>Adjunte aquí el comprobante. Le avisaremos por correo cuando lo verifiquemos.</li>
          </ol>
          <dl className="datos">
            <DatoCopiable etiqueta="Referencia" valor={compra.referencia} />
            <DatoCopiable etiqueta="Valor" valor={formatoPrecio(compra.valor)} />
            <DatoCopiable etiqueta="Banco" valor={compra.datosBancarios.banco} />
            <DatoCopiable etiqueta="Tipo de cuenta" valor={compra.datosBancarios.tipoCuenta} />
            <DatoCopiable etiqueta="Número de cuenta" valor={compra.datosBancarios.numeroCuenta} />
            <DatoCopiable etiqueta="Titular" valor={compra.datosBancarios.titular} />
          </dl>
        </div>
      )}
    </section>
  );
}
