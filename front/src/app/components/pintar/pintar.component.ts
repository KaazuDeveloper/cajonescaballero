import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { fabric } from 'fabric-pure-browser';
import { SelectorColorComponent } from '../selector-color/selector-color.component';
import { PROPIEDADES_EXTRA, PlantillaId, coloresDePlantilla, crearPlantilla, recolorearPlantilla } from '../../shared/plantillas-cajon';
import { CARA_FRONTAL, EscenaCajon, cargarTextura, crearEscenaCajon, imagenMadera, texturasMadera } from '../../shared/escena-cajon';

type Pestana = 'disenos' | 'texto' | 'pincel' | 'anadir';
type Estado = { lienzo: string; madera: boolean };

const ANCHO_LIENZO = 330;
const PROPORCION_TAPA = 0.6;
const FONDO_BLANCO = '#ffffff';

@Component({
  selector: 'app-pintar',
  imports: [FormsModule, TranslatePipe, SelectorColorComponent],
  templateUrl: './pintar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './pintar.component.css',
})
export class PintarComponent implements OnInit, OnDestroy {
  readonly pestanas: { id: Pestana; clave: string; icono: string }[] = [
    { id: 'disenos', clave: 'ui.studio.designs', icono: 'fa-wand-magic-sparkles' },
    { id: 'texto', clave: 'ui.studio.text', icono: 'fa-font' },
    { id: 'pincel', clave: 'ui.studio.brush', icono: 'fa-pencil' },
    { id: 'anadir', clave: 'ui.studio.add', icono: 'fa-shapes' },
  ];
  readonly plantillas: { id: PlantillaId; clave: string }[] = [
    { id: 'roseton', clave: 'ui.make.tplRosette' },
    { id: 'lunares', clave: 'ui.make.tplDots' },
    { id: 'compas', clave: 'ui.make.tplCompas' },
    { id: 'nombre', clave: 'ui.make.tplName' },
  ];
  readonly combinaciones = [
    ['#b3261e', '#1d1d1f'],
    ['#1d4ed8', '#e0a100'],
    ['#1f7a4d', '#e0a100'],
    ['#7a1f5c', '#bf4800'],
    ['#1d1d1f', '#ffffff'],
  ];
  readonly lunaresMuestra = [[5, 8], [25, 8], [45, 8], [65, 8], [15, 25], [35, 25], [55, 25], [5, 42], [25, 42], [45, 42], [65, 42], [15, 59], [35, 59], [55, 59], [5, 76], [25, 76], [45, 76], [65, 76], [15, 93], [35, 93], [55, 93]];
  readonly fuentes = ['Arial', 'Georgia', 'Helvetica', 'Verdana', 'Times New Roman', 'Courier New'];

  pestana: Pestana = 'disenos';
  plantillaActiva?: PlantillaId;
  colorA = '#b3261e';
  colorB = '#1d1d1f';
  textoPlantilla = '';

  texto = '';
  fuente = 'Georgia';
  colorTexto = '#1d1d1f';
  negrita = false;
  alineacion = 'center';

  colorPincel = '#1d1d1f';
  grosorPincel = 8;
  colorForma = '#b3261e';

  conMadera = true;
  seleccion: fabric.Object | null = null;
  tamano = 100;

  private tipoMadera?: string;
  private tipoCuerdas?: string;
  private lienzo!: fabric.Canvas;
  private escena?: EscenaCajon;
  private pasado: Estado[] = [];
  private futuro: Estado[] = [];
  private silencio = true;

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef<HTMLDivElement>;

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit(): void {
    const producto = history.state?.producto;
    if (!producto) {
      this.router.navigate(['/personalizar']);
      return;
    }
    this.tipoMadera = producto.tipoMadera;
    this.tipoCuerdas = producto.tipoCuerdas;
    this.textoPlantilla = sessionStorage.getItem('username') || 'Olé';

    const ancho = Math.max(220, Math.min(ANCHO_LIENZO, window.innerWidth - 76));
    this.lienzo = new fabric.Canvas(this.canvasRef.nativeElement, {
      backgroundColor: FONDO_BLANCO,
      width: ancho,
      height: Math.round(ancho / PROPORCION_TAPA),
      preserveObjectStacking: true,
    });
    this.lienzo.freeDrawingBrush.width = this.grosorPincel;
    this.lienzo.freeDrawingBrush.color = this.colorPincel;

    this.lienzo.on('selection:created', () => this.alSeleccionar());
    this.lienzo.on('selection:updated', () => this.alSeleccionar());
    this.lienzo.on('selection:cleared', () => (this.seleccion = null));
    this.lienzo.on('object:added', () => this.confirmar());
    this.lienzo.on('object:removed', () => this.confirmar());
    this.lienzo.on('object:modified', () => {
      this.leerTamano();
      this.confirmar();
    });

    const caras = texturasMadera(this.tipoMadera);
    caras[CARA_FRONTAL] = producto.dataUrl ?? imagenMadera(this.tipoMadera);
    this.ngZone.runOutsideAngular(() => {
      this.escena = crearEscenaCajon(this.rendererContainer.nativeElement, caras, () => ({
        madera: this.tipoMadera,
        cuerdas: this.tipoCuerdas,
      }));
    });

    if (producto.lienzo) {
      this.conMadera = producto.conMadera ?? true;
      this.lienzo.loadFromJSON(producto.lienzo, () => {
        this.leerPlantilla();
        this.pintarFondo(() => this.empezarHistorial());
      });
    } else {
      this.pintarFondo(() => this.empezarHistorial());
    }
  }

  ngOnDestroy(): void {
    this.escena?.destruir();
  }

  /* Tabs */

  cambiarPestana(pestana: Pestana): void {
    this.pestana = pestana;
    this.lienzo.isDrawingMode = pestana === 'pincel';
    if (pestana === 'pincel') this.lienzo.discardActiveObject().renderAll();
  }

  /* Templates */

  aplicarPlantilla(id: PlantillaId): void {
    this.silencio = true;
    this.quitarPlantilla();
    const texto = this.textoPlantilla.trim() || 'Olé';
    const objeto = crearPlantilla(id, this.lienzo.getWidth(), this.lienzo.getHeight(), texto, this.colorA, this.colorB);
    this.lienzo.add(objeto);
    this.lienzo.sendToBack(objeto);
    this.lienzo.renderAll();
    this.plantillaActiva = id;
    this.silencio = false;
    this.confirmar();
  }

  private objetoPlantilla(): fabric.Object | undefined {
    return this.lienzo.getObjects().find((o) => (o as any).plantilla);
  }

  private quitarPlantilla(): void {
    const actual = this.objetoPlantilla();
    if (actual) this.lienzo.remove(actual);
  }

  private leerPlantilla(): void {
    const plantilla = this.objetoPlantilla();
    this.plantillaActiva = (plantilla as any)?.plantilla;
    if (!plantilla) return;
    const { a, b } = coloresDePlantilla(plantilla);
    this.colorA = a ?? this.colorA;
    this.colorB = b ?? this.colorB;
    if (plantilla instanceof fabric.Textbox) this.textoPlantilla = plantilla.text ?? this.textoPlantilla;
  }

  verColor(cual: 'a' | 'b', color: string): void {
    if (cual === 'a') this.colorA = color;
    else this.colorB = color;
    const plantilla = this.objetoPlantilla();
    if (plantilla) {
      recolorearPlantilla(plantilla, this.colorA, this.colorB);
      this.lienzo.requestRenderAll();
    }
  }

  fijarColor(cual: 'a' | 'b', color: string): void {
    this.verColor(cual, color);
    this.confirmar();
  }

  fijarCombinacion([a, b]: string[]): void {
    this.colorA = a;
    this.fijarColor('b', b);
  }

  cambiarTextoPlantilla(): void {
    const objeto = this.objetoPlantilla();
    if (objeto instanceof fabric.Textbox) {
      objeto.set('text', this.textoPlantilla);
      this.lienzo.requestRenderAll();
    }
  }

  /* Text */

  get textoElegido(): fabric.Textbox | null {
    return this.seleccion instanceof fabric.Textbox && !(this.seleccion as any).plantilla ? this.seleccion : null;
  }

  alEscribir(): void {
    if (this.textoElegido) {
      this.textoElegido.set('text', this.texto);
      this.lienzo.requestRenderAll();
    }
  }

  agregarTexto(): void {
    if (!this.texto.trim() || this.textoElegido) return;
    const ancho = this.lienzo.getWidth();
    const objeto = new fabric.Textbox(this.texto, {
      originX: 'center',
      originY: 'center',
      left: ancho / 2,
      top: this.lienzo.getHeight() / 2,
      width: ancho * 0.84,
      fontSize: ancho * 0.14,
      fontFamily: this.fuente,
      fontWeight: this.negrita ? 'bold' : 'normal',
      textAlign: this.alineacion,
      fill: this.colorTexto,
    });
    this.lienzo.add(objeto);
    this.lienzo.setActiveObject(objeto);
    this.lienzo.renderAll();
    this.texto = '';
    this.alSeleccionar();
  }

  aplicarATexto(): void {
    if (!this.textoElegido) return;
    this.textoElegido.set({
      fontFamily: this.fuente,
      fontWeight: this.negrita ? 'bold' : 'normal',
      textAlign: this.alineacion,
      fill: this.colorTexto,
    });
    this.lienzo.requestRenderAll();
    this.confirmar();
  }

  alternarNegrita(): void {
    this.negrita = !this.negrita;
    this.aplicarATexto();
  }

  fijarAlineacion(alineacion: string): void {
    this.alineacion = alineacion;
    this.aplicarATexto();
  }

  fijarColorTexto(color: string): void {
    this.colorTexto = color;
    this.aplicarATexto();
  }

  verColorTexto(color: string): void {
    this.colorTexto = color;
    if (this.textoElegido) {
      this.textoElegido.set('fill', color);
      this.lienzo.requestRenderAll();
    }
  }

  /* Brush */

  fijarColorPincel(color: string): void {
    this.colorPincel = color;
    this.lienzo.freeDrawingBrush.color = color;
  }

  cambiarGrosor(): void {
    this.lienzo.freeDrawingBrush.width = Number(this.grosorPincel);
  }

  /* Shapes and images */

  private colocar(objeto: fabric.Object): void {
    objeto.set({ originX: 'center', originY: 'center', left: this.lienzo.getWidth() / 2, top: this.lienzo.getHeight() / 2 });
    this.lienzo.add(objeto);
    this.lienzo.setActiveObject(objeto);
    this.lienzo.renderAll();
    this.alSeleccionar();
  }

  agregarForma(forma: 'circulo' | 'cuadrado' | 'triangulo'): void {
    const lado = this.lienzo.getWidth() * 0.34;
    const fill = this.colorForma;
    if (forma === 'circulo') this.colocar(new fabric.Circle({ radius: lado / 2, fill }));
    else if (forma === 'cuadrado') this.colocar(new fabric.Rect({ width: lado, height: lado, fill }));
    else this.colocar(new fabric.Triangle({ width: lado, height: lado, fill }));
  }

  fijarColorForma(color: string): void {
    this.verColorForma(color);
    if (this.seleccion && this.esForma(this.seleccion)) this.confirmar();
  }

  verColorForma(color: string): void {
    this.colorForma = color;
    if (this.seleccion && this.esForma(this.seleccion)) {
      this.seleccion.set('fill', color);
      this.lienzo.requestRenderAll();
    }
  }

  private esForma(objeto: fabric.Object): boolean {
    return ['circle', 'rect', 'triangle'].includes(objeto.type ?? '');
  }

  alSubirImagen(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => {
      fabric.Image.fromURL(lector.result as string, (imagen) => {
        imagen.scaleToWidth(this.lienzo.getWidth() * 0.7);
        this.colocar(imagen);
        entrada.value = '';
      });
    };
    lector.readAsDataURL(archivo);
  }

  /* Selected object */

  private alSeleccionar(): void {
    const objeto = this.lienzo.getActiveObject() ?? null;
    this.seleccion = objeto;
    if (!objeto) return;
    this.leerTamano();
    if ((objeto as any).plantilla) {
      this.pestana = 'disenos';
    } else if (objeto instanceof fabric.Textbox) {
      this.pestana = 'texto';
      this.texto = objeto.text ?? '';
      this.fuente = objeto.fontFamily ?? this.fuente;
      this.colorTexto = objeto.fill as string;
      this.negrita = objeto.fontWeight === 'bold';
      this.alineacion = objeto.textAlign ?? 'center';
    } else if (this.esForma(objeto)) {
      this.pestana = 'anadir';
      this.colorForma = objeto.fill as string;
    }
  }

  private leerTamano(): void {
    if (this.seleccion) this.tamano = Math.round((this.seleccion.scaleX ?? 1) * 100);
  }

  verTamano(): void {
    const objeto = this.seleccion;
    if (!objeto) return;
    const centro = objeto.getCenterPoint();
    objeto.scale(this.tamano / 100);
    objeto.setPositionByOrigin(centro, 'center', 'center');
    objeto.setCoords();
    this.lienzo.requestRenderAll();
  }

  alFrente(): void {
    if (!this.seleccion) return;
    this.lienzo.bringToFront(this.seleccion);
    this.lienzo.renderAll();
    this.confirmar();
  }

  eliminarSeleccion(): void {
    const objeto = this.seleccion;
    if (!objeto) return;
    this.silencio = true;
    const objetos = objeto instanceof fabric.ActiveSelection ? objeto.getObjects() : [objeto];
    this.lienzo.discardActiveObject();
    objetos.forEach((o) => this.lienzo.remove(o));
    this.lienzo.renderAll();
    this.silencio = false;
    this.seleccion = null;
    this.leerPlantilla();
    this.confirmar();
  }

  vaciar(): void {
    this.silencio = true;
    this.lienzo.discardActiveObject();
    this.lienzo.remove(...this.lienzo.getObjects());
    this.lienzo.renderAll();
    this.silencio = false;
    this.seleccion = null;
    this.plantillaActiva = undefined;
    this.confirmar();
  }

  /* Background */

  fijarFondo(madera: boolean): void {
    if (madera === this.conMadera) return;
    this.conMadera = madera;
    this.pintarFondo(() => this.confirmar());
  }

  private pintarFondo(hecho: () => void): void {
    if (!this.conMadera) {
      this.lienzo.backgroundImage = undefined;
      this.lienzo.backgroundColor = FONDO_BLANCO;
      this.lienzo.renderAll();
      hecho();
      return;
    }
    fabric.Image.fromURL(imagenMadera(this.tipoMadera), (imagen) => {
      const escala = Math.max(this.lienzo.getWidth() / imagen.width!, this.lienzo.getHeight() / imagen.height!);
      imagen.set({ scaleX: escala, scaleY: escala, left: 0, top: 0 });
      this.lienzo.backgroundImage = imagen;
      this.lienzo.renderAll();
      hecho();
    });
  }

  /* History */

  get puedeDeshacer(): boolean {
    return this.pasado.length > 1;
  }

  get puedeRehacer(): boolean {
    return this.futuro.length > 0;
  }

  private foto(): Estado {
    return { lienzo: JSON.stringify((this.lienzo as any).toJSON(PROPIEDADES_EXTRA)), madera: this.conMadera };
  }

  private empezarHistorial(): void {
    this.pasado = [this.foto()];
    this.futuro = [];
    this.silencio = false;
    this.actualizarCajon();
  }

  /* Every finished change: saves a step and refreshes the 3D preview. */
  confirmar(): void {
    if (this.silencio) return;
    this.pasado.push(this.foto());
    if (this.pasado.length > 30) this.pasado.shift();
    this.futuro = [];
    this.actualizarCajon();
  }

  private restaurar(estado: Estado): void {
    this.silencio = true;
    this.lienzo.discardActiveObject();
    this.seleccion = null;
    this.lienzo.loadFromJSON(estado.lienzo, () => {
      this.lienzo.renderAll();
      this.conMadera = estado.madera;
      this.leerPlantilla();
      this.silencio = false;
      this.actualizarCajon();
    });
  }

  deshacer(): void {
    if (!this.puedeDeshacer) return;
    this.futuro.push(this.pasado.pop()!);
    this.restaurar(this.pasado[this.pasado.length - 1]);
  }

  rehacer(): void {
    if (!this.puedeRehacer) return;
    const estado = this.futuro.pop()!;
    this.pasado.push(estado);
    this.restaurar(estado);
  }

  @HostListener('document:keydown', ['$event'])
  alPulsarTecla(evento: KeyboardEvent): void {
    const enCampo = /^(INPUT|TEXTAREA|SELECT)$/.test((evento.target as HTMLElement).tagName);
    if (enCampo || (this.seleccion as fabric.IText | null)?.isEditing) return;
    if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'z') {
      evento.preventDefault();
      if (evento.shiftKey) this.rehacer();
      else this.deshacer();
    } else if (evento.key === 'Delete' || evento.key === 'Backspace') {
      if (this.seleccion) {
        evento.preventDefault();
        this.eliminarSeleccion();
      }
    }
  }

  private actualizarCajon(): void {
    const material = this.escena?.materiales[CARA_FRONTAL];
    if (!material) return;
    material.map?.dispose();
    material.map = cargarTextura(this.lienzo.toDataURL({ format: 'png' }));
    material.needsUpdate = true;
  }

  /* Steps */

  private producto() {
    this.lienzo.discardActiveObject().renderAll();
    return {
      tipoMadera: this.tipoMadera,
      tipoCuerdas: this.tipoCuerdas,
      dataUrl: this.lienzo.toDataURL({ format: 'png' }),
      lienzo: this.foto().lienzo,
      conMadera: this.conMadera,
    };
  }

  irAEleccion(): void {
    this.router.navigate(['/personalizar'], { state: { producto: this.producto() } });
  }

  irAVer(): void {
    this.router.navigate(['/personalizar/finalizar'], { state: { producto: this.producto() } });
  }
}
