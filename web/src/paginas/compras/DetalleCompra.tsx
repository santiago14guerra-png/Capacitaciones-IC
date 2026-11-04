import type { CompraDto } from '@ic/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { DatoCopiable } from '../../componentes/Dato';
import { SelectorArchivo } from '../../componentes/SelectorArchivo';
import { EstadoCompra } from '../../componentes/EstadoCompra';
import { api } from '../../lib/api';
import { formatoFechaHora, formatoPrecio } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { abrirArchivo, subirArchivo } from '../../lib/subida';
import { useCarga } from '../../lib/useCarga';

/** HU-12: adjuntar el comprobante; la compra pasa a «En verificación». */
function CargaComprobante({ compra, alSubir }: { compra: CompraDto; alSubir(c: CompraDto): void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
    if (!archivo) return;
    setError(null);
    setEnviando(true);
    try {
      const llave = await subirArchivo(`/compras/${compra.id}/comprobante/subida`, archivo);
      alSubir(await api<CompraDto>(`/compras/${compra.id}/comprobante`, { cuerpo: { llave } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir el comprobante');
    } finally {
      setEnviando(false);
    }
  };
  return (
    <div className="tarjeta pila">
      <h2>{compra.tieneComprobante ? 'Cambiar el comprobante' : 'Adjuntar el comprobante'}</h2>
      <AvisoError mensaje={error} />
      <SelectorArchivo
        id="comprobante"
        etiqueta="Comprobante de la transferencia"
        alElegir={setArchivo}
      />
      <button className="boton" type="button" disabled={!archivo || enviando} onClick={enviar}>
        {enviando ? 'Subiendo…' : 'Enviar comprobante'}
      </button>
    </div>
  );
}

/** HU-11: instrucciones de transferencia con referencia única. */
export default function DetalleCompra() {
  const { id } = useParams();
  const {
    datos: compra,
    setDatos,
    error,
  } = useCarga((s) => api<CompraDto>(`/compras/${id}`, { senal: s }), [id]);
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

      {compra.estado === 'EN_VERIFICACION' && (
        <div className="aviso info" role="status">
          <p>Recibimos su comprobante. Lo verificaremos y le avisaremos por correo.</p>
        </div>
      )}
      {compra.tieneComprobante && (
        <p>
          <button
            className="enlace-boton"
            type="button"
            onClick={() => abrirArchivo(`/compras/${compra.id}/comprobante`)}
          >
            Ver el comprobante enviado
          </button>
        </p>
      )}
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
      {(compra.estado === 'PENDIENTE_PAGO' || compra.estado === 'EN_VERIFICACION') && (
        <CargaComprobante compra={compra} alSubir={setDatos} />
      )}
    </section>
  );
}
