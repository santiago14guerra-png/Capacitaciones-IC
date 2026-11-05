import type { Cupo, Reloj } from './puertos.js';

/** Cupo en memoria por instancia de la API; se reinicia cada minuto del reloj. */
export class CupoPorMinuto implements Cupo {
  private minuto = -1;
  private usados = 0;

  constructor(
    private readonly maximo: number,
    private readonly reloj: Reloj,
  ) {}

  tomar() {
    const minuto = Math.floor(this.reloj.ahora().getTime() / 60_000);
    if (minuto !== this.minuto) {
      this.minuto = minuto;
      this.usados = 0;
    }
    if (this.usados >= this.maximo) return false;
    this.usados++;
    return true;
  }
}
