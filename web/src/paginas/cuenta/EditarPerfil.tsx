import { esquemaPerfil, type PerfilDto } from '@ic/shared';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { CamposFacturacion, type DatosFacturacion } from '../../componentes/CamposFacturacion';
import { api } from '../../lib/api';
import { formatoFecha } from '../../lib/formato';
import { useFormulario } from '../../lib/formulario';
import { useSesion } from '../../lib/sesion';
import { useAccion } from '../../lib/accion';

/** HU-23: actualizar dirección, celular y datos de facturación. */
export default function EditarPerfil() {
  const { sesion, recargar } = useSesion();
  const p = sesion!.perfil!;
  const f = useFormulario<DatosFacturacion>({
    nombres: p.nombres,
    apellidos: p.apellidos,
    tipoDocumento: p.tipoDocumento,
    numeroDocumento: p.numeroDocumento,
    celular: p.celular,
    direccion: p.direccion,
    ciudad: p.ciudad,
  });
  const [aviso, setAviso] = useState<{ tipo: string; texto: string } | null>(null);

  const [enviar, enviando] = useAccion(async (e: FormEvent) => {
    e.preventDefault();
    setAviso(null);
    const d = f.validar(esquemaPerfil);
    if (!d) return;
    try {
      await api<PerfilDto>('/perfil', { metodo: 'PUT', cuerpo: d });
      await recargar();
      setAviso({
        tipo: 'exito',
        texto: 'Datos actualizados. Sus próximas facturas saldrán con esta información.',
      });
    } catch (err) {
      if (!f.errorApi(err))
        setAviso({ tipo: 'error', texto: err instanceof Error ? err.message : 'Ocurrió un error' });
    }
  });

  return (
    <section className="formulario">
      <p>
        <Link to="/cuenta">← Mi cuenta</Link>
      </p>
      <h1>Mi perfil</h1>
      {aviso?.tipo === 'exito' ? (
        <p className="aviso exito" role="status">
          {aviso.texto}
        </p>
      ) : (
        <AvisoError mensaje={aviso?.texto} />
      )}
      <form onSubmit={enviar} noValidate>
        <CamposFacturacion f={f} />
        <div className="campo">
          <span className="etiqueta">Correo electrónico</span>
          <span>{p.correo}</span>
          <span className="ayuda">Es su usuario para ingresar. Para cambiarlo, escríbanos.</span>
        </div>
        <button className="boton" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
      <p className="pequeno suave" style={{ marginTop: '2rem' }}>
        Autorizó el tratamiento de sus datos el {formatoFecha(p.autorizacionDatosEn)} (política
        versión {p.versionPoliticaDatos}). <Link to="/privacidad">Ver la política</Link>
      </p>
    </section>
  );
}
