import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { AjustesSonido, ZonaGolpe, golpearCajon } from './sonido-cajon';

const RUTA_MADERAS = 'assets/img/personalizacion/tiposMadera';

export const MADERAS = [
  { value: 'okume', label: 'Okume', imagen: `${RUTA_MADERAS}/Okume.jpg` },
  { value: 'caoba', label: 'Caoba', imagen: `${RUTA_MADERAS}/Caoba.jpg` },
  { value: 'abedul', label: 'Abedul', imagen: `${RUTA_MADERAS}/Abedul.jpg` },
  { value: 'fenoquilo', label: 'Fenoquilo', imagen: `${RUTA_MADERAS}/Fenoquilo.jpg` },
  { value: 'haya', label: 'Haya', imagen: `${RUTA_MADERAS}/Haya.jpg` },
  { value: 'sapelly', label: 'Sapelly', imagen: `${RUTA_MADERAS}/Sapelly.jpg` },
  { value: 'tilo', label: 'Tilo', imagen: `${RUTA_MADERAS}/Tilo.jpg` },
  { value: 'pino', label: 'Pino', imagen: `${RUTA_MADERAS}/Pino.jpg` },
];

export const imagenMadera = (madera?: string): string =>
  (MADERAS.find((m) => m.value === madera) ?? MADERAS[0]).imagen;

/* The face of the box that carries the player's design. */
export const CARA_FRONTAL = 1;

export const cargarTextura = (url: string): THREE.Texture => {
  const textura = new THREE.TextureLoader().load(url);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.anisotropy = 8;
  return textura;
};

export const texturasMadera = (madera?: string): string[] => Array(6).fill(imagenMadera(madera));

export interface EscenaCajon {
  materiales: THREE.MeshStandardMaterial[];
  zoom(delta: number): void;
  mover(delta: number): void;
  destruir(): void;
}

/* A slowly turning cajón that can be dragged and played, sized to its container. */
export function crearEscenaCajon(
  contenedor: HTMLElement,
  caras: string[],
  sonido: () => AjustesSonido = () => ({}),
): EscenaCajon {
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.touchAction = 'pan-y';
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.cursor = 'grab';
  contenedor.appendChild(renderer.domElement);

  escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8a90, 1.7));
  const principal = new THREE.DirectionalLight(0xffffff, 2.1);
  principal.position.set(3, 4, 6);
  escena.add(principal);
  const relleno = new THREE.DirectionalLight(0xffffff, 0.7);
  relleno.position.set(-5, 1, 2);
  escena.add(relleno);

  const materiales = caras.map(
    (url) => new THREE.MeshStandardMaterial({ map: cargarTextura(url), roughness: 0.72, metalness: 0 }),
  );
  const geometria = new RoundedBoxGeometry(1.8, 2.5, 1.5, 4, 0.05);
  const cajon = new THREE.Mesh(geometria, materiales);
  cajon.rotation.y = Math.PI / 2 - 0.5;
  escena.add(cajon);

  let distancia = 8;
  let factorZoom = 1;
  let desplazamiento = 0;
  const encuadrar = () => {
    camara.position.set(0, 0.55 + desplazamiento, distancia * factorZoom);
    camara.lookAt(0, desplazamiento, 0);
  };
  const ajustar = () => {
    const { clientWidth: ancho, clientHeight: alto } = contenedor;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto);
    camara.aspect = ancho / alto;
    const t = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    distancia = Math.max(3.25 / (2 * t), 2.7 / (2 * t * camara.aspect)) + 0.75;
    encuadrar();
    camara.updateProjectionMatrix();
  };
  const observador = new ResizeObserver(ajustar);
  observador.observe(contenedor);
  ajustar();

  let arrastrando = false;
  let ultimoX = 0;
  let inicioX = 0;
  let inicioY = 0;
  let inicioT = 0;
  let movido = false;
  let golpe = 0;
  let pausaHasta = 0;
  const lienzo = renderer.domElement;
  const rayo = new THREE.Raycaster();

  const tocar = (e: PointerEvent) => {
    camara.updateMatrixWorld();
    cajon.updateMatrixWorld();
    const caja = lienzo.getBoundingClientRect();
    rayo.setFromCamera(
      new THREE.Vector2(((e.clientX - caja.left) / caja.width) * 2 - 1, -((e.clientY - caja.top) / caja.height) * 2 + 1),
      camara,
    );
    const impacto = rayo.intersectObject(cajon)[0];
    if (!impacto) return;
    const altura = (cajon.worldToLocal(impacto.point.clone()).y + 1.25) / 2.5;
    const zona: ZonaGolpe = impacto.face?.materialIndex !== CARA_FRONTAL ? 'canto' : altura > 0.7 ? 'agudo' : 'grave';
    golpearCajon(zona, sonido());
    golpe = 1;
    pausaHasta = performance.now() + 4000;
  };

  const alPulsar = (e: PointerEvent) => {
    arrastrando = true;
    movido = false;
    ultimoX = inicioX = e.clientX;
    inicioY = e.clientY;
    inicioT = performance.now();
    lienzo.setPointerCapture(e.pointerId);
    lienzo.style.cursor = 'grabbing';
  };
  const alMover = (e: PointerEvent) => {
    if (!arrastrando) return;
    if (Math.abs(e.clientX - inicioX) > 5 || Math.abs(e.clientY - inicioY) > 5) movido = true;
    if (movido) cajon.rotation.y += (e.clientX - ultimoX) * 0.01;
    ultimoX = e.clientX;
  };
  const alSoltar = (e: PointerEvent) => {
    if (arrastrando && !movido && e.type === 'pointerup' && performance.now() - inicioT < 400) tocar(e);
    arrastrando = false;
    lienzo.style.cursor = 'grab';
  };
  lienzo.addEventListener('pointerdown', alPulsar);
  lienzo.addEventListener('pointermove', alMover);
  lienzo.addEventListener('pointerup', alSoltar);
  lienzo.addEventListener('pointercancel', alSoltar);

  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let fotograma = 0;
  const animar = () => {
    fotograma = requestAnimationFrame(animar);
    if (!arrastrando && !quieto && performance.now() > pausaHasta) cajon.rotation.y += 0.003;
    if (golpe > 0.01) {
      golpe *= 0.82;
      cajon.scale.setScalar(1 - golpe * 0.014);
    }
    renderer.render(escena, camara);
  };
  animar();

  return {
    materiales,
    zoom(delta) {
      factorZoom = Math.min(1.3, Math.max(0.55, factorZoom + delta));
      encuadrar();
    },
    mover(delta) {
      desplazamiento = Math.min(1, Math.max(-1, desplazamiento + delta));
      encuadrar();
    },
    destruir() {
      cancelAnimationFrame(fotograma);
      observador.disconnect();
      geometria.dispose();
      materiales.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      renderer.dispose();
      lienzo.remove();
    },
  };
}
