import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { pedidoService } from '../../services/pedido.service';
import { Producto } from '../../interfaces/producto';
import { Router } from '@angular/router';
import { SumPrecioPipe } from '../../pipes/sum-precio.pipe';
import { CuerdasPipe } from '../../pipes/cuerdas.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerService } from '../../services/spinner-service.service';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
@Component({
    selector: 'app-gestion-pedidos',
    imports: [TranslatePipe, SumPrecioPipe, DecimalPipe, CuerdasPipe, ReactiveFormsModule, FormsModule],
    templateUrl: './gestion-pedidos.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './gestion-pedidos.component.css'
})
export class GestionPedidosComponent {
  pedidos: any[] = [];
  precioTotal = 0;
  constructor(private pedidoService: pedidoService, private router : Router, private spinner : SpinnerService) { }

  ngOnInit(): void {
    this.obtenerPedidosUsuario();
  }

  obtenerPedidosUsuario(): void {
    this.spinner.show()
    this.pedidoService.obtenerPedidos().subscribe(
      (response: any) => {
        this.pedidos = response;
        this.spinner.hide()
      },
      (error: any) => {
        this.spinner.hide()
      }
    );
  }
  borrarPedido(id: string): void {
    this.spinner.show();
    this.pedidoService.delPedido(id).subscribe(() => {
      this.pedidos = this.pedidos.filter(pedido => pedido._id !== id);
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
    });
  }

  cambiarEstadoPedido(pedido: any): void {
    this.spinner.show();
    this.pedidoService.updatePedido(pedido._id, { estado: pedido.estado }).subscribe(() => {
      this.spinner.hide();
    }, error => {
      this.spinner.hide();
    });
  }

  trackByPedidoId(index: number, pedido: any): string {
    return pedido._id;
  }

  descargarImagen(dataUrl: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'custom_cajon_image.png';
    link.click();
  }
}
