import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sumPrecio',
  standalone: true
})
export class SumPrecioPipe implements PipeTransform {
  precioTotal = 0;
  transform(pedido: any): number {
    for (let i = 0; i < pedido.productos.length; i++) {
      this.precioTotal += pedido.productos[i].total;
    }
    return this.precioTotal;
  }

}
