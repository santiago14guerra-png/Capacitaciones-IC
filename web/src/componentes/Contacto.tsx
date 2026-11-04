import { enlaceCorreo, enlaceWhatsapp, useConfigPublica } from '../lib/configPublica';

/** Correo y WhatsApp de la empresa; si aún no los entregó, se ve el marcador pendiente. */
export function Contacto({ claro }: { claro?: boolean }) {
  const config = useConfigPublica();
  if (!config) return null;
  const correo = enlaceCorreo(config.correo);
  const wa = enlaceWhatsapp(config.whatsapp);
  const estilo = claro ? { color: '#fff' } : undefined;
  return (
    <ul className="contacto" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      <li>
        Correo:{' '}
        {correo ? (
          <a href={correo} style={estilo}>
            {config.correo}
          </a>
        ) : (
          <mark>{config.correo}</mark>
        )}
      </li>
      <li>
        WhatsApp:{' '}
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" style={estilo}>
            Escribirnos por WhatsApp
          </a>
        ) : (
          <mark>{config.whatsapp}</mark>
        )}
      </li>
    </ul>
  );
}
