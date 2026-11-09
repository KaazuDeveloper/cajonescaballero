import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Producto } from '../../interfaces/producto';
import { productoService } from '../../services/producto.service';
import { SpinnerService } from '../../services/spinner-service.service';
import { EscenaCajon, MADERAS, crearEscenaCajon } from '../../shared/escena-cajon';

const RUTA = 'assets/img/design';
const CARAS = ['tableroAgujero', 'tableroEnfrente', 'tableroLateral', 'tableroLateral', 'tableroLateral', 'tableroLateral'].map(
  (nombre) => `${RUTA}/${nombre}.jpg`,
);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, RouterLink, DecimalPipe],
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly maderas = MADERAS;
  cuatroProductos?: Producto[];
  private escena?: EscenaCajon;

  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private translate: TranslateService,
    private spinnerService: SpinnerService,
    private ngZone: NgZone,
    private productos: productoService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.escena = crearEscenaCajon(this.rendererContainer.nativeElement, CARAS, () => ({ madera: 'sapelly', cuerdas: 'varias-cuerdas' }));
    });
    this.spinnerService.show();
    this.productos.getCuatroProductos().subscribe({
      next: (productos) => {
        this.cuatroProductos = productos;
        this.spinnerService.hide();
      },
      error: () => this.spinnerService.hide(),
    });
    this.mostrarAviso('showToastRegister', 'registrado_correctamente');
    this.mostrarAviso('showToastLogin', 'ui.toast.login');
  }

  ngOnDestroy(): void {
    this.escena?.destruir();
  }

  irProducto(producto: Producto): void {
    this.router.navigate(['producto'], { state: { producto } });
  }

  private mostrarAviso(bandera: string, clave: string): void {
    if (localStorage.getItem(bandera) !== 'true') return;
    localStorage.removeItem(bandera);
    this.translate.get(clave).subscribe((titulo: string) => {
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', iconColor: '#bf4800', title: titulo });
    });
  }
}
