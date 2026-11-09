export type ZonaGolpe = 'grave' | 'agudo' | 'canto';

export interface AjustesSonido {
  madera?: string;
  cuerdas?: string;
}

/* Denser woods ring slightly higher. */
const TONO_MADERA: Record<string, number> = {
  okume: 0.9,
  pino: 0.93,
  tilo: 0.95,
  fenoquilo: 1,
  abedul: 1.02,
  caoba: 1.03,
  haya: 1.05,
  sapelly: 1.07,
};

/* How much snare buzz each string setup adds. */
const ZUMBIDO_CUERDAS: Record<string, number> = {
  'sin-cuerdas': 0,
  'una-cuerda-central': 0.3,
  'dos-cuerdas-v': 0.5,
  'varias-cuerdas': 0.85,
};

let contexto: AudioContext | undefined;
let ruido: AudioBuffer | undefined;

const ruidoBlanco = (ctx: BaseAudioContext): AudioBuffer => {
  if (!ruido) {
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const muestras = ruido.getChannelData(0);
    for (let i = 0; i < muestras.length; i++) muestras[i] = Math.random() * 2 - 1;
  }
  return ruido;
};

const envolvente = (ctx: BaseAudioContext, t: number, nivel: number, caida: number): GainNode => {
  const ganancia = ctx.createGain();
  ganancia.gain.setValueAtTime(nivel, t);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, t + caida);
  return ganancia;
};

const tono = (ctx: BaseAudioContext, salida: AudioNode, t: number, desde: number, hasta: number, nivel: number, caida: number) => {
  const oscilador = ctx.createOscillator();
  oscilador.frequency.setValueAtTime(desde, t);
  oscilador.frequency.exponentialRampToValueAtTime(hasta, t + caida * 0.6);
  oscilador.connect(envolvente(ctx, t, nivel, caida)).connect(salida);
  oscilador.start(t);
  oscilador.stop(t + caida);
};

const banda = (ctx: BaseAudioContext, salida: AudioNode, t: number, tipo: BiquadFilterType, frecuencia: number, nivel: number, caida: number) => {
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruidoBlanco(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipo;
  filtro.frequency.value = frecuencia;
  filtro.Q.value = 0.8;
  fuente.connect(filtro).connect(envolvente(ctx, t, nivel, caida)).connect(salida);
  fuente.start(t, Math.random() * 0.5, caida);
};

/* Synthesised, so there are no audio files: a pitched thump plus filtered noise. */
export function golpearCajon(zona: ZonaGolpe, { madera = '', cuerdas = '' }: AjustesSonido): void {
  contexto ??= new AudioContext();
  const ctx = contexto;
  if (ctx.state === 'suspended') void ctx.resume();

  const t = ctx.currentTime;
  const salida = ctx.createDynamicsCompressor();
  salida.connect(ctx.destination);
  const f = TONO_MADERA[madera] ?? 1;
  const zumbido = ZUMBIDO_CUERDAS[cuerdas] ?? 0;

  if (zona === 'grave') {
    tono(ctx, salida, t, 135 * f, 62 * f, 1, 0.28);
    tono(ctx, salida, t, 240 * f, 120 * f, 0.25, 0.07);
    banda(ctx, salida, t, 'lowpass', 900, 0.35, 0.03);
    if (zumbido) banda(ctx, salida, t, 'highpass', 3200, zumbido * 0.22, 0.16 + zumbido * 0.1);
  } else if (zona === 'agudo') {
    banda(ctx, salida, t, 'bandpass', 2300 * f, 2.4, 0.13);
    tono(ctx, salida, t, 420 * f, 300 * f, 0.45, 0.07);
    if (zumbido) banda(ctx, salida, t, 'highpass', 3200, zumbido * 0.8, 0.16 + zumbido * 0.1);
  } else {
    tono(ctx, salida, t, 520 * f, 380 * f, 0.35, 0.05);
    banda(ctx, salida, t, 'bandpass', 1200 * f, 0.4, 0.035);
  }
}
