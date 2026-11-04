import { GRUPOS, type SesionDto } from '@ic/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router';
import { api, configurarApi } from './api';
import { Autenticador } from './autenticacion/autenticador';
import { transporteCognito } from './autenticacion/cognito';
import { transporteLocal } from './autenticacion/local';
import { cargarConfig } from './config';

interface ValorSesion {
  cargando: boolean;
  sesion: SesionDto | null;
  esPersonal: boolean;
  autenticador: Autenticador;
  recargar(): Promise<SesionDto | null>;
  salir(): Promise<void>;
}

const Contexto = createContext<ValorSesion | null>(null);

export async function crearAutenticador() {
  const config = await cargarConfig();
  return new Autenticador(
    config.modo === 'local'
      ? transporteLocal()
      : transporteCognito(config.region!, config.clientId!),
  );
}

export function ProveedorSesion({
  children,
  autenticador,
}: {
  children: ReactNode;
  autenticador: Autenticador;
}) {
  const [sesion, setSesion] = useState<SesionDto | null>(null);
  const [cargando, setCargando] = useState(autenticador.haySesion());

  const recargar = useCallback(async () => {
    if (!autenticador.haySesion()) {
      setSesion(null);
      return null;
    }
    try {
      const s = await api<SesionDto>('/sesion');
      setSesion(s);
      return s;
    } catch {
      autenticador.olvidar();
      setSesion(null);
      return null;
    } finally {
      setCargando(false);
    }
  }, [autenticador]);

  useEffect(() => {
    configurarApi(
      () => autenticador.tokenAcceso(),
      () => {
        autenticador.olvidar();
        setSesion(null);
      },
    );
    void recargar();
    // HU-03 CA4: si el navegador restaura una página desde su caché al usar «Atrás», se recarga
    // para que vuelva a pasar por la verificación de sesión.
    const alMostrar = (e: PageTransitionEvent) => e.persisted && window.location.reload();
    window.addEventListener('pageshow', alMostrar);
    return () => window.removeEventListener('pageshow', alMostrar);
  }, [autenticador, recargar]);

  const valor = useMemo<ValorSesion>(
    () => ({
      cargando,
      sesion,
      autenticador,
      esPersonal: !!sesion?.grupos.some((g) => g === GRUPOS.administrador || g === GRUPOS.director),
      recargar,
      salir: async () => {
        await autenticador.salir();
        setSesion(null);
      },
    }),
    [cargando, sesion, autenticador, recargar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSesion fuera de ProveedorSesion');
  return v;
}

/** Solo acepta rutas internas para evitar redirecciones abiertas. */
export const rutaSegura = (v: string | null | undefined) =>
  v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : '/';

export function useRutaIngreso() {
  const l = useLocation();
  return `/ingresar?volver=${encodeURIComponent(l.pathname + l.search)}`;
}

export function Cargando() {
  return (
    <p className="cargando" role="status">
      Cargando…
    </p>
  );
}

/** Rutas privadas: sin sesión, lleva a ingresar y luego regresa a la misma página. */
export function RequiereSesion({ children }: { children: ReactNode }) {
  const { cargando, sesion, esPersonal } = useSesion();
  const l = useLocation();
  const ingreso = useRutaIngreso();
  if (cargando) return <Cargando />;
  if (!sesion) return <Navigate to={ingreso} replace />;
  // HU-02 CA6: un cliente sin datos de facturación los completa antes de seguir.
  if (!sesion.perfil && !esPersonal && l.pathname !== '/cuenta/completar') {
    return (
      <Navigate
        to={`/cuenta/completar?volver=${encodeURIComponent(l.pathname + l.search)}`}
        replace
      />
    );
  }
  return <>{children}</>;
}
