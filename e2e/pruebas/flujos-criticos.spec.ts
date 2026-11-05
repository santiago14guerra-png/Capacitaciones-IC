import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const CLAVE = 'Clave1234';
const CODIGO = '123456';
const TITULO = `Declaración de renta de pensionados ${Date.now()}`;

async function crearFicha(request: APIRequestContext) {
  const ingreso = await request.post('/api/dev/auth/ingresar', {
    data: { correo: 'director@ic.local', clave: CLAVE },
  });
  const { acceso } = await ingreso.json();
  const categorias = await (await request.get('/api/categorias')).json();
  const ficha = await request.post('/api/admin/fichas', {
    headers: { authorization: `Bearer ${acceso}` },
    data: {
      titulo: TITULO,
      pregunta: '¿Un pensionado debe declarar renta?',
      resumen: 'Explica cuándo un pensionado está obligado a declarar.',
      respuestaHtml: '<p>Respuesta completa solo para quien compra.</p>',
      categoriaId: categorias[0].id,
      etiquetas: ['pensión'],
      normas: ['Estatuto Tributario'],
      precio: 35000,
      publicar: true,
    },
  });
  expect(ficha.ok()).toBe(true);
}

async function registrar(page: Page, correo: string) {
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
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Código de verificación').fill(CODIGO);
  await page.getByRole('button', { name: 'Activar cuenta' }).click();
}

test('buscar, registrarse, comprar y verificar el pago', async ({ page, request }) => {
  await crearFicha(request);
  const correo = `cliente-${Date.now()}@correo.co`;

  await test.step('el visitante busca y ve la ficha sin la respuesta', async () => {
    await page.goto('/');
    await page.getByRole('searchbox').first().fill('pensionados');
    await page.getByRole('searchbox').first().press('Enter');
    await page.getByRole('link', { name: TITULO }).click();
    await expect(page.getByRole('heading', { name: TITULO })).toBeVisible();
    await expect(page.getByText('Respuesta completa solo para quien compra.')).toHaveCount(0);
  });

  await test.step('se registra y vuelve a la ficha', async () => {
    await page.getByRole('link', { name: 'Obtener respuesta' }).first().click();
    await page.getByRole('link', { name: 'Crear una cuenta' }).click();
    await registrar(page, correo);
    await expect(page.getByRole('heading', { name: TITULO })).toBeVisible();
  });

  await test.step('compra y carga el comprobante', async () => {
    await page.getByRole('button', { name: /Comprar por transferencia/ }).click();
    await expect(page.getByText(/RPN-\d{6}/).first()).toBeVisible();
    await page.locator('input[type=file]').setInputFiles({
      name: 'comprobante.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 comprobante'),
    });
    await page
      .getByRole('button', { name: /Enviar|Cargar|Subir/ })
      .first()
      .click();
    await expect(page.getByText('En verificación').first()).toBeVisible();
  });
  const ficha = new URL(page.url());
  expect(ficha.pathname).toContain('/compras/');

  await test.step('la administradora aprueba el pago', async () => {
    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click();
    await page.goto('/ingresar?volver=/panel/pagos');
    await page.getByLabel('Correo electrónico').fill('administrador@ic.local');
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    const fila = page.getByRole('row').filter({ hasText: TITULO });
    await fila.getByRole('button', { name: 'Aprobar' }).click();
    await expect(page.getByRole('row').filter({ hasText: TITULO })).toHaveCount(0);
    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click();
  });

  await test.step('el cliente ve la respuesta completa', async () => {
    await page.goto(`/ingresar?volver=${encodeURIComponent(ficha.pathname)}`);
    await page.getByLabel('Correo electrónico').fill(correo);
    await page.getByLabel('Contraseña').fill(CLAVE);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.getByRole('link', { name: 'Leer la respuesta' }).first().click();
    await expect(page.getByText('Respuesta completa solo para quien compra.')).toBeVisible();
  });
});
