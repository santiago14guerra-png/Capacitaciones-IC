import { VERSION_POLITICA_DATOS } from '@ic/shared';
import { Link } from 'react-router';
import { DocumentoLegal, Pendiente } from './Legal';

export default function PoliticaDatos() {
  return (
    <DocumentoLegal
      titulo="Política de tratamiento de datos personales"
      version={VERSION_POLITICA_DATOS}
    >
      <h2>1. Responsable del tratamiento</h2>
      <p>
        <Pendiente>razón social</Pendiente> («Capacitaciones IC»), identificada con NIT{' '}
        <Pendiente>NIT</Pendiente>, con domicilio en <Pendiente>dirección y ciudad</Pendiente>,
        correo <Pendiente>correo para asuntos de datos personales</Pendiente> y teléfono{' '}
        <Pendiente>teléfono</Pendiente>.
      </p>

      <h2>2. Marco legal</h2>
      <p>
        Esta política se expide en cumplimiento de la Ley Estatutaria 1581 de 2012 y sus decretos
        reglamentarios, compilados en el Decreto Único Reglamentario 1074 de 2015.
      </p>

      <h2>3. Datos que recogemos</h2>
      <ul>
        <li>
          Datos de identificación y contacto: nombres, apellidos, tipo y número de documento,
          correo, celular, dirección y ciudad.
        </li>
        <li>Comprobantes de pago que usted adjunta al comprar una respuesta.</li>
        <li>Las consultas que envía, sus adjuntos y las respuestas que recibe.</li>
        <li>
          Registros técnicos sin datos personales: términos buscados, fecha y número de resultados.
        </li>
      </ul>
      <p>
        No solicitamos datos sensibles. Si una consulta los contiene, le pedimos no incluirlos salvo
        que sean indispensables para responderla.
      </p>

      <h2>4. Finalidades</h2>
      <ul>
        <li>Crear y administrar su cuenta y permitirle iniciar sesión.</li>
        <li>Verificar sus pagos y darle acceso a las respuestas que adquiere.</li>
        <li>Expedir la factura electrónica de sus compras.</li>
        <li>Recibir, gestionar y responder sus consultas.</li>
        <li>Enviarle avisos sobre sus pagos y consultas por correo electrónico.</li>
        <li>
          Elaborar estadísticas internas sin identificar a las personas, para decidir qué contenido
          publicar. Las respuestas que se publican como fichas se anonimizan antes.
        </li>
      </ul>

      <h2>5. Derechos del titular</h2>
      <p>Usted puede, de forma gratuita:</p>
      <ul>
        <li>Conocer, actualizar y rectificar sus datos.</li>
        <li>Solicitar prueba de la autorización que otorgó.</li>
        <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
        <li>Revocar la autorización o pedir la supresión de sus datos cuando proceda.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
      </ul>
      <p>
        Puede actualizar buena parte de sus datos en <Link to="/cuenta/perfil">Mi perfil</Link>.
      </p>

      <h2>6. Consultas y reclamos</h2>
      <p>
        Escríbanos a <Pendiente>correo para asuntos de datos personales</Pendiente> con su nombre,
        documento y lo que solicita. Las consultas se responden en un máximo de diez (10) días
        hábiles y los reclamos en un máximo de quince (15) días hábiles, en los términos de los
        artículos 14 y 15 de la Ley 1581 de 2012.
      </p>

      <h2>7. Encargados y transferencias</h2>
      <p>
        La plataforma funciona sobre los servicios de Amazon Web Services, que almacena la
        información cifrada en{' '}
        <Pendiente>
          región y país de los servidores; confirmar con el abogado el tratamiento de la transmisión
          internacional
        </Pendiente>
        . Para facturar se usa el software Siigo. Ambos actúan como encargados del tratamiento.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Las contraseñas las administra Amazon Cognito y no las conocemos. La información viaja por
        HTTPS, se guarda cifrada y los comprobantes y adjuntos solo los ven usted y el personal
        autorizado.
      </p>

      <h2>9. Vigencia</h2>
      <p>
        Esta política rige desde <Pendiente>fecha de entrada en vigencia</Pendiente>. Los datos se
        conservan mientras tenga una cuenta activa y durante el tiempo que exijan las normas
        contables y tributarias. <Pendiente>plazo de conservación</Pendiente>
      </p>
    </DocumentoLegal>
  );
}
