import { fabric } from 'fabric-pure-browser';

export type PlantillaId = 'roseton' | 'lunares' | 'compas' | 'nombre';
export type Rol = 'a' | 'b';

/* Custom properties kept when the canvas is saved and restored. */
export const PROPIEDADES_EXTRA = ['plantilla', 'rol'];

const CENTRADO = { originX: 'center', originY: 'center' } as const;

const conRol = <T extends fabric.Object>(objeto: T, rol: Rol): T => {
  (objeto as any).rol = rol;
  return objeto;
};

const aro = (cx: number, cy: number, radius: number, color: string, strokeWidth: number) =>
  conRol(new fabric.Circle({ ...CENTRADO, left: cx, top: cy, radius, fill: 'transparent', stroke: color, strokeWidth }), 'b');

const roseton = (ancho: number, alto: number, a: string, b: string): fabric.Object[] => {
  const cx = ancho / 2;
  const cy = alto * 0.45;
  const radio = ancho * 0.36;
  const petalos = Array.from({ length: 12 }, (_, i) => {
    const angulo = (i * Math.PI) / 6;
    return conRol(
      new fabric.Ellipse({
        ...CENTRADO,
        left: cx + Math.cos(angulo) * radio * 0.56,
        top: cy + Math.sin(angulo) * radio * 0.56,
        rx: radio * 0.13,
        ry: radio * 0.38,
        angle: (angulo * 180) / Math.PI + 90,
        fill: i % 2 ? b : a,
      }),
      i % 2 ? 'b' : 'a',
    );
  });
  return [
    aro(cx, cy, radio * 1.08, b, 2),
    ...petalos,
    conRol(new fabric.Circle({ ...CENTRADO, left: cx, top: cy, radius: radio * 0.16, fill: b }), 'b'),
  ];
};

const lunares = (ancho: number, alto: number, a: string): fabric.Object[] => {
  const paso = ancho / 4.5;
  const objetos: fabric.Object[] = [];
  for (let fila = 0; fila * paso * 0.86 < alto + paso; fila++) {
    for (let col = 0; col < 6; col++) {
      objetos.push(
        conRol(
          new fabric.Circle({ ...CENTRADO, left: col * paso + (fila % 2 ? paso / 2 : 0), top: fila * paso * 0.86, radius: ancho * 0.07, fill: a }),
          'a',
        ),
      );
    }
  }
  return objetos;
};

/* The twelve-beat flamenco cycle, with the accents of a bulería. */
const compas = (ancho: number, alto: number, a: string, b: string): fabric.Object[] => {
  const acentos = [3, 6, 8, 10, 12];
  const cx = ancho / 2;
  const cy = alto * 0.45;
  const radio = ancho * 0.36;
  const golpes = Array.from({ length: 12 }, (_, i) => {
    const pulso = i + 1;
    const angulo = (pulso * Math.PI) / 6 - Math.PI / 2;
    const acento = acentos.includes(pulso);
    return conRol(
      new fabric.Circle({ ...CENTRADO, left: cx + Math.cos(angulo) * radio, top: cy + Math.sin(angulo) * radio, radius: ancho * (acento ? 0.06 : 0.025), fill: acento ? a : b }),
      acento ? 'a' : 'b',
    );
  });
  return [
    aro(cx, cy, radio, b, 1.5),
    ...golpes,
    conRol(new fabric.Text('12', { ...CENTRADO, left: cx, top: cy, fontFamily: 'Times New Roman', fontSize: ancho * 0.26, fill: b }), 'b'),
  ];
};

/* A template is one object: it moves and scales as a whole. */
export function crearPlantilla(id: PlantillaId, ancho: number, alto: number, texto: string, a: string, b: string): fabric.Object {
  let objeto: fabric.Object;
  if (id === 'nombre') {
    objeto = conRol(
      new fabric.Textbox(texto, {
        ...CENTRADO,
        left: ancho / 2,
        top: alto / 2,
        width: alto * 0.86,
        angle: -90,
        textAlign: 'center',
        fontFamily: 'Times New Roman',
        fontStyle: 'italic',
        fontSize: ancho * 0.26,
        fill: a,
      }),
      'a',
    );
  } else {
    const piezas = id === 'roseton' ? roseton(ancho, alto, a, b) : id === 'lunares' ? lunares(ancho, alto, a) : compas(ancho, alto, a, b);
    objeto = new fabric.Group(piezas, { subTargetCheck: false });
  }
  (objeto as any).plantilla = id;
  return objeto;
}

const pintar = (objeto: fabric.Object, a: string, b: string): void => {
  const color = (objeto as any).rol === 'a' ? a : b;
  objeto.set(objeto.fill === 'transparent' ? 'stroke' : 'fill', color);
};

export function recolorearPlantilla(plantilla: fabric.Object, a: string, b: string): void {
  if (plantilla instanceof fabric.Group) {
    plantilla.getObjects().forEach((pieza) => pintar(pieza, a, b));
    plantilla.set('dirty', true);
  } else {
    pintar(plantilla, a, b);
  }
}

/* The colours currently used by a template, for after undo or returning to this step. */
export function coloresDePlantilla(plantilla: fabric.Object): { a?: string; b?: string } {
  const piezas = plantilla instanceof fabric.Group ? plantilla.getObjects() : [plantilla];
  const color = (rol: Rol) => {
    const pieza = piezas.find((p) => (p as any).rol === rol && p.fill !== 'transparent');
    return pieza?.fill as string | undefined;
  };
  return { a: color('a'), b: color('b') };
}
