import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { EscenaCajon, MADERAS, cargarTextura, crearEscenaCajon, imagenMadera, texturasMadera } from '../../shared/escena-cajon';

@Component({
  selector: 'app-personalizar',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './personalizar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './personalizar.component.css',
})
export class PersonalizarComponent implements OnInit, OnDestroy {
  readonly tiposMadera = MADERAS;
  tipoMadera = 'okume';
  tipoCuerdas = 'sin-cuerdas';
  dataUrl?: string;
  private lienzo?: string;
  private conMadera?: boolean;
  private escena?: EscenaCajon;

  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef<HTMLDivElement>;

  constructor(private ngZone: NgZone, private router: Router) {}

  ngOnInit(): void {
    const producto = history.state?.producto;
    if (producto) {
      this.tipoMadera = producto.tipoMadera;
      this.tipoCuerdas = producto.tipoCuerdas;
      this.dataUrl = producto.dataUrl;
      this.lienzo = producto.lienzo;
      this.conMadera = producto.conMadera;
    }
    this.ngZone.runOutsideAngular(() => {
      this.escena = crearEscenaCajon(this.rendererContainer.nativeElement, texturasMadera(this.tipoMadera), () => ({
        madera: this.tipoMadera,
        cuerdas: this.tipoCuerdas,
      }));
    });
  }

  ngOnDestroy(): void {
    this.escena?.destruir();
  }

  actualizarCajon(madera: string): void {
    const textura = cargarTextura(imagenMadera(madera));
    this.escena?.materiales.forEach((material) => {
      material.map?.dispose();
      material.map = textura;
      material.needsUpdate = true;
    });
  }

  irAPintar(): void {
    const producto = {
      tipoMadera: this.tipoMadera,
      tipoCuerdas: this.tipoCuerdas,
      dataUrl: this.dataUrl,
      lienzo: this.lienzo,
      conMadera: this.conMadera,
    };
    this.router.navigate(['/personalizar/pintar'], { state: { producto } });
  }
}
