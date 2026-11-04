import { esquemaGuardarPerfil } from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import {
  CamposFacturacion,
  facturacionVacia,
  type DatosFacturacion,
} from '../../componentes/CamposFacturacion';
import { CasillaAutorizacion } from '../../componentes/CasillaAutorizacion';
import { api } from '../../lib/api';
import { useFormulario } from '../../lib/formulario';
import { rutaSegura, useSesion } from '../../lib/sesion';
import { useAccion } from '../../lib/accion';

/** Si la cuenta se activó pero los datos de facturación no alcanzaron a guardarse. */
export default function CompletarPerfil() {
  const { recargar } = useSesion();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const f = useFormulario<DatosFacturacion & { autorizaDatos: boolean }>({
    ...facturacionVacia,
    autorizaDatos: false,
  });
  const [error, setError] = useState<string | null>(null);

  const [enviar, guardando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    const d = f.validar(esquemaGuardarPerfil);
    if (!d) return;
    try {
      await api('/perfil', { metodo: 'PUT', cuerpo: d });
      await recargar();
      navegar(rutaSegura(params.get('volver')), { replace: true });
    } catch (err) {
      if (!f.errorApi(err)) setError(err instanceof Error ? err.message : 'Ocurrió un error');
    }
  });

  return (
    <section className="formulario">
      <h1>Complete sus datos</h1>
      <p className="suave">Los necesitamos una sola vez para facturar sus compras.</p>
      <AvisoError mensaje={error} />
      <form onSubmit={enviar} noValidate>
        <CamposFacturacion f={f} />
        <CasillaAutorizacion
          marcada={f.valores.autorizaDatos}
          alCambiar={(v) => f.poner('autorizaDatos', v)}
          error={f.errores.autorizaDatos}
        />
        <button
          className="boton"
          type="submit"
          disabled={!f.valores.autorizaDatos || guardando}
          aria-busy={guardando}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </section>
  );
}
