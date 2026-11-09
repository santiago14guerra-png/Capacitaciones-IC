/**
 * Recorrido grabado de la plataforma para el videotutorial y las capturas de la entrega 3.
 *
 * Corre contra la app local (`npm run dev`), con datos de demostración que crea por la API.
 * Las respuestas de las fichas son textos de ejemplo: el contenido real lo redactan los directores.
 *
 *   npm run demo --workspace e2e            # deja video y capturas en e2e/demo/salida
 */
import { mkdirSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type APIRequestContext, type Page } from '@playwright/test';

const BASE = process.env.DEMO_URL ?? 'http://127.0.0.1:5173';
const SALIDA = join(import.meta.dirname, 'salida');
const CLAVE = 'Clave1234';
const PAUSA = Number(process.env.DEMO_PAUSA ?? 3200);
const sello = Date.now();

const AVISO_DEMO =
  '<p><em>Contenido de demostración.</em> La respuesta definitiva la redacta el director técnico ' +
  'con el criterio de Capacitaciones IC y las normas citadas.</p>';

const FICHAS = [
  {
    titulo: '¿Cómo declaro un arriendo si quien recibe el canon es otra persona?',
    pregunta:
      'Soy propietaria de un apartamento, pero mi hermana lo arrienda y recibe el dinero. ¿A nombre de quién se declara el ingreso?',
    resumen:
      'Explica a quién corresponde declarar el ingreso por arrendamiento y qué documento permite que un tercero lo reciba.',
    etiquetas: ['arrendamiento', 'mandato', 'exógena'],
    normas: ['Estatuto Tributario', 'Código Civil, contrato de mandato'],
    precio: 35000,
    categoria: 'Arrendamientos',
  },
  {
    titulo: '¿Un pensionado debe declarar renta?',
    pregunta: 'Recibo una pensión y no tengo otros ingresos. ¿Estoy obligado a declarar?',
    resumen: 'Revisa los topes de ingresos y patrimonio que obligan a declarar a un pensionado.',
    etiquetas: ['pensión', 'topes'],
    normas: ['Estatuto Tributario'],
    precio: 30000,
    categoria: 'Pensionados',
  },
  {
    titulo: 'Heredé una casa: ¿qué debo reportar en la declaración?',
    pregunta: 'Recibí un inmueble por herencia este año. ¿Cómo lo incluyo en mi declaración?',
    resumen: 'Explica cómo se trata un bien recibido por herencia y qué ganancia ocasional genera.',
    etiquetas: ['herencia', 'ganancia ocasional'],
    normas: ['Estatuto Tributario'],
    precio: 40000,
    categoria: 'Sucesiones y herencias',
  },
  {
    titulo: 'Soy independiente: ¿qué costos puedo restar de mis ingresos?',
    pregunta: 'Trabajo por prestación de servicios. ¿Qué gastos me acepta la DIAN?',
    resumen: 'Resume los costos y deducciones que puede soportar un trabajador independiente.',
    etiquetas: ['independientes', 'deducciones'],
    normas: ['Estatuto Tributario'],
    precio: 35000,
    categoria: 'Asalariados e independientes',
  },
  {
    titulo: '¿Cómo declaro un carro que compré a crédito?',
    pregunta: 'Compré un vehículo con un préstamo. ¿Cómo lo reporto en el patrimonio?',
    resumen: 'Indica cómo se registran el bien y la deuda en el patrimonio bruto y líquido.',
    etiquetas: ['patrimonio', 'deudas'],
    normas: ['Estatuto Tributario'],
    precio: 25000,
    categoria: 'Patrimonio y bienes',
  },
  {
    titulo: 'Me llegó una carta de la DIAN: ¿qué hago?',
    pregunta: 'Recibí un emplazamiento por no declarar. ¿Qué plazos y opciones tengo?',
    resumen:
      'Orienta sobre cómo leer la comunicación y cuáles son los pasos y plazos para responder.',
    etiquetas: ['DIAN', 'emplazamiento'],
    normas: ['Estatuto Tributario'],
    precio: 45000,
    categoria: 'Obligaciones con la DIAN',
  },
];

async function token(api: APIRequestContext, correo: string) {
  const r = await api.post('/api/dev/auth/ingresar', { data: { correo, clave: CLAVE } });
  if (!r.ok()) throw new Error(`No se pudo ingresar como ${correo}: ${r.status()}`);
  return `Bearer ${(await r.json()).acceso}`;
}

async function sembrar(api: APIRequestContext) {
  const director = await token(api, 'director@ic.local');
  const categorias: { id: string; nombre: string }[] = await (
    await api.get('/api/categorias')
  ).json();
  const idDe = (nombre: string) =>
    (categorias.find((c) => c.nombre === nombre) ?? categorias[0]!).id;
  for (const f of FICHAS) {
    const r = await api.post('/api/admin/fichas', {
      headers: { authorization: director },
      data: {
        titulo: f.titulo,
        pregunta: f.pregunta,
        resumen: f.resumen,
        respuestaHtml: AVISO_DEMO,
        categoriaId: idDe(f.categoria),
        etiquetas: f.etiquetas,
        normas: f.normas,
        precio: f.precio,
        publicar: true,
      },
    });
    if (!r.ok()) throw new Error(`Ficha no creada: ${await r.text()}`);
  }
  // Búsquedas para que el panel de indicadores tenga datos, incluida una sin resultados.
  for (const q of ['arriendo', 'pension', 'herencia', 'criptomonedas']) {
    await api.get(`/api/fichas?q=${encodeURIComponent(q)}`);
  }
  return { categorias, director };
}

/** Rótulo visible en el video; se oculta antes de cada captura. */
async function rotulo(page: Page, texto: string) {
  await page.evaluate((t) => {
    let d = document.getElementById('rotulo-demo');
    if (!d) {
      d = document.createElement('div');
      d.id = 'rotulo-demo';
      d.style.cssText =
        'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;' +
        'background:#16302a;color:#fff;font:600 20px/1.3 system-ui;padding:12px 22px;' +
        'border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:80%;text-align:center';
      document.body.appendChild(d);
    }
    d.textContent = t;
    d.style.display = 'block';
  }, texto);
  await page.waitForTimeout(PAUSA);
}

async function captura(page: Page, nombre: string) {
  await page.evaluate(() => {
    const d = document.getElementById('rotulo-demo');
    if (d) d.style.display = 'none';
  });
  await page.screenshot({ path: join(SALIDA, `${nombre}.png`) });
}

async function ingresar(page: Page, correo: string, volver: string) {
  await page.goto(`/ingresar?volver=${encodeURIComponent(volver)}`);
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL((u) => u.pathname === volver.split('?')[0]);
}

async function salir(page: Page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).first().click();
  await page.waitForTimeout(500);
}

async function main() {
  mkdirSync(SALIDA, { recursive: true });
  const navegador = await chromium.launch();
  const api = (await navegador.newContext({ baseURL: BASE })).request;
  const { categorias, director } = await sembrar(api);

  const contexto = await navegador.newContext({
    baseURL: BASE,
    viewport: { width: 1366, height: 768 },
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    recordVideo: { dir: SALIDA, size: { width: 1366, height: 768 } },
  });
  const page = await contexto.newPage();
  const correo = `cliente.demo.${sello}@correo.co`;

  // 1. Visitante
  await page.goto('/');
  await page.waitForTimeout(1500);
  await rotulo(
    page,
    '1. El visitante entra al sitio y ve el buscador, los temas y las respuestas recientes',
  );
  await captura(page, '01-inicio');
  await page.getByRole('searchbox').first().fill('arriendo');
  await page.getByRole('searchbox').first().press('Enter');
  await page.waitForURL(/buscar/);
  await rotulo(page, '2. Busca con sus palabras: no distingue tildes y resalta el término');
  await captura(page, '02-busqueda');
  await page.goto('/catalogo');
  await rotulo(page, '3. También puede explorar el catálogo por categoría');
  await captura(page, '03-catalogo');
  await page.getByRole('link', { name: FICHAS[0]!.titulo }).first().click();
  await page.getByRole('heading', { name: FICHAS[0]!.titulo }).waitFor();
  await rotulo(page, '4. Ve la pregunta, el resumen y las normas; la respuesta sigue bloqueada');
  await captura(page, '04-ficha-bloqueada');
  const urlFicha = new URL(page.url()).pathname;

  // 2. Registro
  await page.getByRole('link', { name: 'Obtener respuesta' }).first().click();
  await page.getByRole('link', { name: 'Crear una cuenta' }).click();
  await page.getByLabel('Nombres').fill('Ana María');
  await page.getByLabel('Apellidos').fill('Ruiz Gómez');
  await page.getByLabel('Tipo de documento').selectOption({ label: 'Cédula de ciudadanía' });
  await page.getByLabel('Número de documento').fill('43123456');
  await page.getByLabel('Celular').fill('3001234567');
  await page.getByLabel('Ciudad').fill('Medellín');
  await page.getByLabel('Dirección').fill('Calle 10 # 20-30');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(CLAVE);
  await page.getByLabel('Confirmar contraseña').fill(CLAVE);
  await page.getByRole('checkbox').check();
  await rotulo(
    page,
    '5. Se registra una sola vez con sus datos de facturación y autoriza el tratamiento de datos',
  );
  await captura(page, '05-registro');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Código de verificación').fill('123456');
  await rotulo(page, '6. Confirma la cuenta con el código que llega a su correo');
  await page.getByRole('button', { name: 'Activar cuenta' }).click();
  await page.getByRole('heading', { name: FICHAS[0]!.titulo }).waitFor();

  // 3. Compra
  await page.getByRole('button', { name: /Comprar por transferencia/ }).click();
  await page
    .getByText(/RPN-\d{6}/)
    .first()
    .waitFor();
  await rotulo(page, '7. Recibe los datos bancarios con una referencia única para transferir');
  await captura(page, '06-instrucciones-pago');
  await page.locator('input[type=file]').setInputFiles({
    name: 'comprobante.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 comprobante de demostración'),
  });
  await page
    .getByRole('button', { name: /Enviar|Cargar|Subir/ })
    .first()
    .click();
  await page.getByText('En verificación').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 0));
  await rotulo(page, '8. Adjunta el comprobante y la compra queda «En verificación»');
  await captura(page, '07-comprobante-enviado');

  // 4. Consulta nueva
  await page.goto('/consultas/nueva');
  await page.getByLabel('Categoría').selectOption({ index: 1 });
  await page.getByLabel('Asunto').pressSequentially('pensión de mi mamá', { delay: 60 });
  await page.waitForTimeout(1200);
  await rotulo(
    page,
    '9. Si no encuentra su caso, envía una consulta; antes le sugiere fichas parecidas',
  );
  await captura(page, '08-consulta-sugerencias');
  await page
    .getByLabel('Descripción')
    .fill('Mi mamá recibe pensión y además arrienda un local. ¿Debe declarar renta este año?');
  await page
    .getByRole('button', { name: /Enviar/ })
    .first()
    .click();
  await page.getByRole('heading', { name: 'Recibimos su consulta' }).waitFor();
  await rotulo(page, '10. La consulta queda radicada con número y fecha');
  await captura(page, '09-consulta-radicada');
  await salir(page);

  // 5. Administradora
  await ingresar(page, 'administrador@ic.local', '/panel/pagos');
  await page.getByRole('row').filter({ hasText: FICHAS[0]!.titulo }).first().waitFor();
  await rotulo(page, '11. La administradora ve en una sola bandeja los pagos con su comprobante');
  await captura(page, '10-bandeja-pagos');
  await page
    .getByRole('row')
    .filter({ hasText: FICHAS[0]!.titulo })
    .getByRole('button', { name: 'Aprobar' })
    .click();
  await page.waitForTimeout(800);
  await rotulo(page, '12. Aprueba el pago: el cliente recibe acceso y un correo de aviso');
  await page.goto('/panel/siigo');
  await rotulo(page, '13. Exporta en Excel los datos de facturación para importarlos en Siigo');
  await captura(page, '11-exportar-siigo');
  await page.goto('/panel/indicadores');
  await page.waitForTimeout(800);
  await rotulo(
    page,
    '14. Consulta los indicadores: consultas, tiempos, temas, búsquedas sin resultado y ventas',
  );
  await captura(page, '12-indicadores');
  await salir(page);

  // 6. Director
  await ingresar(page, 'director@ic.local', '/panel/consultas');
  await rotulo(page, '15. El director gestiona las consultas por estado y antigüedad');
  await captura(page, '13-bandeja-consultas');
  await page.getByRole('link', { name: /RAD-/ }).first().click();
  await page.getByRole('heading', { name: 'Gestión' }).waitFor();
  await rotulo(
    page,
    '16. Clasifica la consulta, la responde y puede convertirla en una ficha nueva',
  );
  await captura(page, '14-gestion-consulta');
  const id = new URL(page.url()).pathname.split('/').pop()!;
  await api.patch(`/api/admin/consultas/${id}`, {
    headers: { authorization: director },
    data: {
      estado: 'RESPONDIDA',
      clasificacion: 'CONSULTA_RAPIDA',
      respuestaHtml: AVISO_DEMO,
    },
  });
  await page.goto('/panel/fichas/nueva');
  await rotulo(
    page,
    '17. Crea y publica fichas con su resumen público, respuesta, normas y precio',
  );
  await captura(page, '15-nueva-ficha');
  await salir(page);

  // 7. Cliente de nuevo
  await ingresar(page, correo, '/cuenta/biblioteca');
  await rotulo(page, '18. El cliente encuentra en su biblioteca las respuestas que compró');
  await captura(page, '16-biblioteca');
  await page.goto(urlFicha);
  await page.getByText('Contenido de demostración.').scrollIntoViewIfNeeded();
  await rotulo(page, '19. Y ahora sí lee la respuesta completa');
  await captura(page, '17-respuesta-completa');
  await page.goto('/cuenta/consultas');
  await rotulo(page, '20. También sigue el estado y la respuesta de sus consultas');
  await captura(page, '18-mis-consultas');

  await contexto.close();

  // Vista de celular (360 px) para la evidencia de diseño adaptable.
  const celular = await navegador.newContext({
    baseURL: BASE,
    viewport: { width: 360, height: 780 },
    locale: 'es-CO',
  });
  const p = await celular.newPage();
  await p.goto('/');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: join(SALIDA, '19-inicio-celular.png'), fullPage: true });
  await celular.close();
  await navegador.close();

  const video = readdirSync(SALIDA).find((f) => f.endsWith('.webm') && !f.startsWith('recorrido'));
  if (video) renameSync(join(SALIDA, video), join(SALIDA, 'recorrido.webm'));
  console.log(`Listo: ${SALIDA} (categorías: ${categorias.length})`);
}

await main();
