// Inicia la API y el sitio a la vez en Windows, macOS y Linux (npm run dev).
import { spawn } from 'node:child_process';
import process from 'node:process';

const procesos = ['api', 'web'].map((ws) =>
  spawn('npm', ['run', 'dev', '--workspace', ws], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }),
);
const terminar = () => procesos.forEach((p) => p.kill());
process.on('SIGINT', terminar);
process.on('SIGTERM', terminar);
procesos.forEach((p) =>
  p.on('exit', (codigo) => {
    terminar();
    process.exit(codigo ?? 0);
  }),
);
