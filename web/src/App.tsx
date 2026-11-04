import { createBrowserRouter, RouterProvider } from 'react-router';
import { Diseno } from './componentes/Diseno';
import Inicio from './paginas/Inicio';
import NoEncontrada from './paginas/NoEncontrada';

const enrutador = createBrowserRouter([
  {
    element: <Diseno />,
    children: [
      { index: true, element: <Inicio /> },
      { path: '*', element: <NoEncontrada /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={enrutador} />;
}
