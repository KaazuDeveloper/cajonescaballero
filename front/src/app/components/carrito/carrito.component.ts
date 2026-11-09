import { DecimalPipe } from '@angular/common';
import { Component, NgModule, ChangeDetectionStrategy } from '@angular/core';
import { Producto } from '../../interfaces/producto';
import { Router, RouterLink } from '@angular/router';
import { StripeService } from '../../services/stripe.service';
import { TranslatePipe } from '@ngx-translate/core';
import { CarritoService } from '../../services/carrito.service';

@Component({
    selector: 'app-carrito',
    imports: [DecimalPipe, TranslatePipe, RouterLink],
    templateUrl: './carrito.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './carrito.component.css'
})
export class CarritoComponent {
  productosEnCarrito: any[] = [];

  constructor(private router: Router, private stripeService: StripeService, private carritoService: CarritoService) {}

  ngOnInit(): void {
    this.carritoService.obtenerCarrito().subscribe(carrito => {
      this.productosEnCarrito = carrito;
    });
  }

  verProducto(producto: Producto){
    this.router.navigate(['producto'], { state: { producto } });
  }

  agregarProducto(item: any) {
    this.carritoService.agregarProducto(item.producto);
  }

  eliminarProducto(item: any) {
    this.carritoService.eliminarProducto(item.producto);
  }

  get total(): number {
    return this.productosEnCarrito.reduce((suma, item) => suma + item.producto.precio * item.cantidad, 0);
  }

  comprarAhora(): void {
    const disponibles = this.productosEnCarrito.filter((item) => item.producto.stock > 0);
    if (disponibles.length === 0) return;

    localStorage.setItem(
      'compra',
      JSON.stringify(
        disponibles.map((item) => ({
          nombre: item.producto.nombre,
          descripcion: item.producto.descripcion,
          precio: item.producto.precio,
          cantidad: item.cantidad,
          id: item.producto._id,
          imagen_url: item.producto.imagen_url,
        })),
      ),
    );
    this.stripeService.procesarPago({
      items: disponibles.map((item) => ({ id: item.producto._id!, cantidad: item.cantidad })),
    });
  }
}
