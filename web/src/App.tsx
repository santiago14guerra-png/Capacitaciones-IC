import { createBrowserRouter, RouterProvider } from 'react-router';
import { Diseno } from './componentes/Diseno';
import type { Autenticador } from './lib/autenticacion/autenticador';
import { ProveedorSesion, RequiereSesion } from './lib/sesion';
import CompletarPerfil from './paginas/cuenta/CompletarPerfil';
import MiCuenta from './paginas/cuenta/MiCuenta';
import ConfirmarCuenta from './paginas/ConfirmarCuenta';
import Ingresar from './paginas/Ingresar';
import Inicio from './paginas/Inicio';
import PoliticaDatos from './paginas/legal/PoliticaDatos';
import Terminos from './paginas/legal/Terminos';
import NoEncontrada from './paginas/NoEncontrada';
import DisenoPanel from './paginas/panel/DisenoPanel';
import InicioPanel from './paginas/panel/InicioPanel';
import CategoriasPanel from './paginas/panel/Categorias';
import NuevaFicha from './paginas/panel/NuevaFicha';
import Registro from './paginas/Registro';

export const rutas = [
  {
    element: <Diseno />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'ingresar', element: <Ingresar /> },
      { path: 'registro', element: <Registro /> },
      { path: 'registro/confirmar', element: <ConfirmarCuenta /> },
      { path: 'privacidad', element: <PoliticaDatos /> },
      { path: 'terminos', element: <Terminos /> },
      {
        path: 'cuenta',
        element: (
          <RequiereSesion>
            <MiCuenta />
          </RequiereSesion>
        ),
      },
      {
        path: 'cuenta/completar',
        element: (
          <RequiereSesion>
            <CompletarPerfil />
          </RequiereSesion>
        ),
      },
      {
        path: 'panel',
        element: <DisenoPanel />,
        children: [
          { index: true, element: <InicioPanel /> },
          { path: 'categorias', element: <CategoriasPanel /> },
          { path: 'fichas/nueva', element: <NuevaFicha /> },
        ],
      },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
];

const enrutador = createBrowserRouter(rutas);

export default function App({ autenticador }: { autenticador: Autenticador }) {
  return (
    <ProveedorSesion autenticador={autenticador}>
      <RouterProvider router={enrutador} />
    </ProveedorSesion>
  );
}
