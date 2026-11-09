// src/app/components/exito/exito.component.ts
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { pedidoService } from '../../services/pedido.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import { CompressImageService } from '../../services/compressimage.service';

@Component({
    selector: 'app-exito',
    imports: [TranslatePipe, RouterLink],
    templateUrl: './exito.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./exito.component.css']
})
export class ExitoComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private ordenCompraService: pedidoService,
    private carritoService: CarritoService,
    private compressImageService: CompressImageService // Inyecta tu servicio
  ) {}

  borrarPedido(): void {
    localStorage.removeItem('compra');
  }

  async ngOnInit(): Promise<void> {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) return;

    const guardado = JSON.parse(localStorage.getItem('compra') || '[]');
    const compra: any[] = Array.isArray(guardado) ? guardado : [guardado];

    try {
      const dataUrl = await this.comprimirDiseno(compra.find((p) => p.dataUrl)?.dataUrl);
      this.ordenCompraService.enviarOrdenCompra({ session_id: sessionId, dataUrl }).subscribe({
        next: () => {
          const carrito = this.carritoService.obtenerCarritoDesdeLocalStorage();
          const comprados = new Set(compra.map((p) => p.id));
          this.carritoService.actualizarCarrito(carrito.filter((item: any) => !comprados.has(item.producto._id)));
          this.borrarPedido();
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  private comprimirDiseno(dataUrl?: string): Promise<string | undefined> {
    if (!dataUrl) return Promise.resolve(undefined);
    return new Promise((resolve, reject) => {
      const imagen = new Image();
      imagen.onerror = () => reject(new Error('Image load error'));
      imagen.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imagen.width;
        canvas.height = imagen.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Unable to get canvas context'));
        ctx.drawImage(imagen, 0, 0);
        this.compressImageService.compressImage(canvas, 0.5).then(resolve, reject);
      };
      imagen.src = dataUrl;
    });
  }
}
