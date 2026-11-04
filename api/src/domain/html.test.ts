import { describe, expect, it } from 'vitest';
import { sanearHtml } from './html.js';

describe('sanearHtml', () => {
  it('conserva negrita, listas y enlaces seguros', () => {
    expect(
      sanearHtml('<p><b>Hola</b></p><ul><li>uno</li></ul><a href="https://dian.gov.co">DIAN</a>'),
    ).toBe(
      '<p><b>Hola</b></p><ul><li>uno</li></ul><a href="https://dian.gov.co" target="_blank" rel="noopener noreferrer">DIAN</a>',
    );
  });
  it('elimina scripts, eventos y enlaces javascript', () => {
    const r = sanearHtml(
      '<p onclick="x()">a</p><script>alert(1)</script><a href="javascript:alert(1)">b</a><img src=x onerror=y>',
    );
    expect(r).toBe('<p>a</p><a target="_blank" rel="noopener noreferrer">b</a>');
  });
});
