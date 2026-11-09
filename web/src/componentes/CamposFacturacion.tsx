import { TIPOS_DOCUMENTO } from '@ic/shared';
import type { Errores, useFormulario } from '../lib/formulario';
import { Campo } from './Campo';

export const ETIQUETAS_DOCUMENTO: Record<(typeof TIPOS_DOCUMENTO)[number], string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  NIT: 'NIT',
  PASAPORTE: 'Pasaporte',
};

export interface DatosFacturacion extends Record<string, unknown> {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  celular: string;
  direccion: string;
  ciudad: string;
}

export const facturacionVacia: DatosFacturacion = {
  nombres: '',
  apellidos: '',
  tipoDocumento: '',
  numeroDocumento: '',
  celular: '',
  direccion: '',
  ciudad: '',
};

type CampoProps = ReturnType<ReturnType<typeof useFormulario<DatosFacturacion>>['campo']>;

/** Lo mínimo que necesita del formulario; sirve para formularios que agregan más campos. */
export interface FormularioFacturacion {
  campo(nombre: keyof DatosFacturacion & string): CampoProps;
  errores: Errores;
  valores: { tipoDocumento: unknown };
}

/** Campos de datos personales y de facturación (HU-02 CA1 y HU-23). */
export function CamposFacturacion({ f }: { f: FormularioFacturacion }) {
  const { campo, errores } = f;
  return (
    <>
      <div className="dos-columnas">
        <Campo nombre="nombres" etiqueta="Nombres" error={errores.nombres}>
          <input {...campo('nombres')} autoComplete="given-name" />
        </Campo>
        <Campo nombre="apellidos" etiqueta="Apellidos" error={errores.apellidos}>
          <input {...campo('apellidos')} autoComplete="family-name" />
        </Campo>
        <Campo nombre="tipoDocumento" etiqueta="Tipo de documento" error={errores.tipoDocumento}>
          <select {...campo('tipoDocumento')}>
            <option value="">Seleccione…</option>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>
                {ETIQUETAS_DOCUMENTO[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo
          nombre="numeroDocumento"
          etiqueta="Número de documento"
          error={errores.numeroDocumento}
          ayuda="Solo números, sin puntos (excepto pasaporte)."
        >
          <input
            {...campo('numeroDocumento')}
            inputMode={f.valores.tipoDocumento === 'PASAPORTE' ? 'text' : 'numeric'}
          />
        </Campo>
        <Campo nombre="celular" etiqueta="Celular" error={errores.celular}>
          <input {...campo('celular')} type="tel" inputMode="tel" autoComplete="tel" />
        </Campo>
        <Campo nombre="ciudad" etiqueta="Ciudad" error={errores.ciudad}>
          <input {...campo('ciudad')} autoComplete="address-level2" />
        </Campo>
      </div>
      <Campo nombre="direccion" etiqueta="Dirección" error={errores.direccion}>
        <input {...campo('direccion')} autoComplete="street-address" />
      </Campo>
    </>
  );
}
