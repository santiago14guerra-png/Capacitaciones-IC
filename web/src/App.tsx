import { createBrowserRouter, RouterProvider } from 'react-router';
import { Diseno } from './componentes/Diseno';
import type { Autenticador } from './lib/autenticacion/autenticador';
import { ProveedorSesion, RequiereSesion } from './lib/sesion';
import DetalleCompra from './paginas/compras/DetalleCompra';
import Biblioteca from './paginas/cuenta/Biblioteca';
import CompletarPerfil from './paginas/cuenta/CompletarPerfil';
import MiCuenta from './paginas/cuenta/MiCuenta';
import ConfirmarCuenta from './paginas/ConfirmarCuenta';
import Buscar from './paginas/Buscar';
import Catalogo from './paginas/Catalogo';
import DetalleFicha from './paginas/DetalleFicha';
import Ingresar from './paginas/Ingresar';
import Inicio from './paginas/Inicio';
import PoliticaDatos from './paginas/legal/PoliticaDatos';
import Terminos from './paginas/legal/Terminos';
import NoEncontrada from './paginas/NoEncontrada';
import DisenoPanel from './paginas/panel/DisenoPanel';
import InicioPanel from './paginas/panel/InicioPanel';
import CategoriasPanel from './paginas/panel/Categorias';
import NuevaFicha from './paginas/panel/NuevaFicha';
import FichasPanel from './paginas/panel/Fichas';
import EditarFicha from './paginas/panel/EditarFicha';
import Pagos from './paginas/panel/Pagos';
import Registro from './paginas/Registro';

export const rutas = [
  {
    element: <Diseno />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'catalogo', element: <Catalogo /> },
      { path: 'buscar', element: <Buscar /> },
      { path: 'fichas/:id', element: <DetalleFicha /> },
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
        path: 'compras/:id',
        element: (
          <RequiereSesion>
            <DetalleCompra />
          </RequiereSesion>
        ),
      },
      {
        path: 'cuenta/biblioteca',
        element: (
          <RequiereSesion>
            <Biblioteca />
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
          { path: 'fichas', element: <FichasPanel /> },
          { path: 'fichas/nueva', element: <NuevaFicha /> },
          { path: 'fichas/:id', element: <EditarFicha /> },
          { path: 'pagos', element: <Pagos /> },
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
