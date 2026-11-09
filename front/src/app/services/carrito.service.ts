import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito = new BehaviorSubject<any[]>(this.obtenerCarritoDesdeLocalStorage());

  obtenerCarrito() {
    return this.carrito.asObservable();
  }

  agregarProducto(producto: any) {
    let carrito = this.carrito.value;
    let index = carrito.findIndex(item => item.producto._id === producto._id);
    if (index !== -1) {
      carrito[index].cantidad++;
    } else {
      carrito.push({ producto: producto, cantidad: 1 });
    }
    this.actualizarCarrito(carrito);
  }

  eliminarProducto(producto: any) {
    let carrito = this.carrito.value;
    let index = carrito.findIndex(item => item.producto._id === producto._id);
    if (index !== -1) {
      carrito[index].cantidad--;
      if (carrito[index].cantidad === 0) {
        carrito.splice(index, 1);
      }
    }
    this.actualizarCarrito(carrito);
  }

  actualizarCarrito(carrito: any[]) {
    this.carrito.next(carrito);
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }

  obtenerCarritoDesdeLocalStorage(): any[] {
    const carritoStr = localStorage.getItem('carrito');
    return carritoStr ? JSON.parse(carritoStr) : [];
  }

  borrarCompra(): void {
    localStorage.removeItem('compra');
  }
}
