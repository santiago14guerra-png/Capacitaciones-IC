import { createBrowserRouter, RouterProvider } from 'react-router';
import { Diseno } from './componentes/Diseno';
import type { Autenticador } from './lib/autenticacion/autenticador';
import { ProveedorSesion, RequiereSesion } from './lib/sesion';
import MiCuenta from './paginas/cuenta/MiCuenta';
import Ingresar from './paginas/Ingresar';
import Inicio from './paginas/Inicio';
import NoEncontrada from './paginas/NoEncontrada';

export const rutas = [
  {
    element: <Diseno />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'ingresar', element: <Ingresar /> },
      {
        path: 'cuenta',
        element: (
          <RequiereSesion>
            <MiCuenta />
          </RequiereSesion>
        ),
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
