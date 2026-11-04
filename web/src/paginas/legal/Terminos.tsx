import { AVISO_ASESORIA } from '@ic/shared';
import { Link } from 'react-router';
import { DocumentoLegal, Pendiente } from './Legal';

export default function Terminos() {
  return (
    <DocumentoLegal titulo="Términos y condiciones de uso" version="0.1-borrador">
      <h2>1. Objeto</h2>
      <p>
        «Respuestas para Personas Naturales» es una plataforma de{' '}
        <Pendiente>razón social</Pendiente> que publica respuestas a preguntas tributarias
        frecuentes de personas naturales y recibe consultas nuevas.
      </p>

      <h2>2. Naturaleza de la información</h2>
      <p>
        {AVISO_ASESORIA}. Cada respuesta indica la fecha hasta la cual está vigente y las normas que
        la sustentan; las normas cambian y la respuesta puede no aplicar a su situación particular.
      </p>

      <h2>3. Cuenta</h2>
      <p>
        Para comprar respuestas o enviar consultas debe crear una cuenta con datos verdaderos. Usted
        es responsable de la confidencialidad de su contraseña.
      </p>

      <h2>4. Compra de respuestas</h2>
      <ul>
        <li>
          El pago se hace por transferencia bancaria usando la referencia única de cada compra.
        </li>
        <li>El acceso se habilita cuando el personal verifica el comprobante.</li>
        <li>
          Si el pago se rechaza, verá el motivo en su cuenta. Política de devoluciones:{' '}
          <Pendiente>política de devoluciones</Pendiente>
        </li>
        <li>
          Una respuesta adquirida sigue disponible en su cuenta aunque luego se retire del catálogo.
        </li>
      </ul>

      <h2>5. Consultas y asesorías</h2>
      <p>
        Las consultas nuevas se clasifican como consulta rápida o asesoría. Las condiciones y
        tarifas se publican en <Link to="/tarifas">Tarifas y alcance</Link>.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        Las respuestas son obra de Capacitaciones IC. Puede usarlas para su caso personal; no está
        permitido copiarlas, venderlas ni publicarlas sin autorización escrita.
      </p>

      <h2>7. Responsabilidad</h2>
      <p>
        <Pendiente>alcance y límites de responsabilidad, a redactar por el abogado</Pendiente>
      </p>

      <h2>8. Datos personales</h2>
      <p>
        El tratamiento de sus datos se rige por la{' '}
        <Link to="/privacidad">Política de tratamiento de datos personales</Link>.
      </p>

      <h2>9. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República de Colombia.</p>
    </DocumentoLegal>
  );
}
