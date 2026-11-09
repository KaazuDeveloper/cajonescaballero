import { RouterLink } from '@angular/router';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { pedidoService } from '../../services/pedido.service';
import { Producto } from '../../interfaces/producto';
import { Router } from '@angular/router';
import { SumPrecioPipe } from '../../pipes/sum-precio.pipe';
import { CuerdasPipe } from '../../pipes/cuerdas.pipe';
import { TranslatePipe } from '@ngx-translate/core';
import { SpinnerService } from '../../services/spinner-service.service';

@Component({
    selector: 'app-pedidos',
    imports: [RouterLink, SumPrecioPipe, DecimalPipe, CuerdasPipe, TranslatePipe],
    templateUrl: './pedidos.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './pedidos.component.css'
})
export class PedidosComponent {
  pedidos: any[] = []; // Arreglo para almacenar los pedidos del usuario
  precioTotal = 0;
  constructor(private pedidoService: pedidoService, private router : Router, private spinner : SpinnerService) { }

  ngOnInit(): void {
    // Llama a una función en tu servicio que obtenga los pedidos del usuario actual
    this.obtenerPedidosUsuario();
  }

  obtenerPedidosUsuario(): void {
    this.spinner.show()
    let idUsuario = sessionStorage.getItem("userId");
    // Aquí llamas a tu servicio para obtener los pedidos del usuario actual
    // El método obtenerPedidosUsuario() debería devolver un arreglo de objetos que representen los pedidos del usuario
    this.pedidoService.obtenerPedidosUsuario(idUsuario || "").subscribe(
      (response: any) => {
        this.pedidos = response; // Asigna la respuesta del servicio a la propiedad pedidos
        this.spinner.hide()
      },
      (error: any) => {
        this.spinner.hide()
      }
    );


  }

}
