import { Pipe, PipeTransform } from '@angular/core';
import { Producto } from '../interfaces/producto';

@Pipe({
  name: 'priceFilter',
  standalone: true
})
export class PriceFilterPipe implements PipeTransform {
  transform(productos: Producto[], minPrice: number, maxPrice: number): Producto[] {
    if (!productos || (!minPrice && minPrice !== 0) || (!maxPrice && maxPrice !== 0)) {
      return productos;
    }

    // Redondear los precios para evitar problemas de comparación con números flotantes
    minPrice = Math.round(minPrice * 100) / 100;
    maxPrice = Math.round(maxPrice * 100) / 100;

    return productos.filter(producto => producto.precio >= minPrice && producto.precio <= maxPrice);
  }
}
