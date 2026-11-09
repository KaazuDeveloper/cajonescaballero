import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { TranslatePipe } from '@ngx-translate/core';
import { StripeService } from '../../services/stripe.service';
import { CARA_FRONTAL, EscenaCajon, crearEscenaCajon, texturasMadera } from '../../shared/escena-cajon';

@Component({
  selector: 'app-final-cajon',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './final-cajon.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './final-cajon.component.css',
})
export class FinalCajonComponent implements OnInit, OnDestroy {
  tipoMadera?: string;
  tipoCuerdas?: string;
  dataUrl?: string;
  private lienzo?: string;
  private conMadera?: boolean;
  private escena?: EscenaCajon;

  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private router: Router,
    private stripeService: StripeService,
    private ngZone: NgZone,
    public sesion: LoginService,
  ) {}

  ngOnInit(): void {
    const producto = history.state?.producto;
    if (!producto) {
      this.router.navigate(['/personalizar']);
      return;
    }
    this.tipoMadera = producto.tipoMadera;
    this.tipoCuerdas = producto.tipoCuerdas;
    this.dataUrl = producto.dataUrl;
    this.lienzo = producto.lienzo;
    this.conMadera = producto.conMadera;

    const caras = texturasMadera(this.tipoMadera);
    if (this.dataUrl) caras[CARA_FRONTAL] = this.dataUrl;
    this.ngZone.runOutsideAngular(() => {
      this.escena = crearEscenaCajon(this.rendererContainer.nativeElement, caras, () => ({
        madera: this.tipoMadera,
        cuerdas: this.tipoCuerdas,
      }));
    });
  }

  ngOnDestroy(): void {
    this.escena?.destruir();
  }

  zoomIn(): void {
    this.escena?.zoom(-0.08);
  }

  zoomOut(): void {
    this.escena?.zoom(0.08);
  }

  goUp(): void {
    this.escena?.mover(-0.12);
  }

  goDown(): void {
    this.escena?.mover(0.12);
  }

  irAVer(): void {
    const producto = {
      tipoMadera: this.tipoMadera,
      tipoCuerdas: this.tipoCuerdas,
      dataUrl: this.dataUrl,
      lienzo: this.lienzo,
      conMadera: this.conMadera,
    };
    this.router.navigate(['/personalizar/pintar'], { state: { producto } });
  }

  descargar(): void {
    if (!this.dataUrl) return;
    const enlace = document.createElement('a');
    enlace.download = 'diseñoPersonalizado.png';
    enlace.href = this.dataUrl;
    enlace.click();
  }

  comprar(): void {
    localStorage.setItem(
      'compra',
      JSON.stringify({
        nombre: 'Cajon personalizado',
        descripcion: 'Venta de cajon personalizado',
        cantidad: 1,
        tipoCuerdas: this.tipoCuerdas,
        tipoMadera: this.tipoMadera,
        dataUrl: this.dataUrl,
      }),
    );
    this.stripeService.procesarPago({
      personalizado: { tipoMadera: this.tipoMadera, tipoCuerdas: this.tipoCuerdas },
    });
  }
}
