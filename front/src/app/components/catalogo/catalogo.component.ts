import { DecimalPipe } from '@angular/common';
import { Component, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { Producto } from '../../interfaces/producto';
import { productoService } from '../../services/producto.service';
import { FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { PriceFilterPipe } from '../../pipes/price-filter.pipe';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerService } from '../../services/spinner-service.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
    selector: 'app-catalogo',
    imports: [TranslatePipe, DecimalPipe, FormsModule],
    templateUrl: './catalogo.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './catalogo.component.css'
})
export class CatalogoComponent implements OnInit{
  minPrice: number = 0;
  maxPrice: number = 500;
  ordenFecha: string = 'recientes';
  productos: Producto[] = [];
  productosIniciales: Producto[] = [];
  page: number = 1;
  itemsPerPage: number = 16;
  totalItems: number = 0;
  selectedCategory: string = 'todas';
  filtroNombre: string = '';
  messageWithLink?: string;

  constructor(
    private productoService: productoService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private translate: TranslateService,
    private spinner: SpinnerService,
    private carritoService: CarritoService // Inyecta CarritoService
  ) {
    this.translate.onLangChange.subscribe(() => {
      this.setMessageWithLink();
    });
    this.setMessageWithLink();
  }

  setMessageWithLink(): void {
    if (this.translate.getCurrentLang() === 'es') {
      this.messageWithLink = `<p style='margin-bottom:3px;'>Producto añadido al carrito satisfactoriamente.</p> <a href="/carrito">Ver carrito</a>`;
    } else if (this.translate.getCurrentLang() === 'en') {
      this.messageWithLink = `<p style='margin-bottom:3px;'>Product added to cart successfully.</p> <a href="/carrito">View cart</a>`;
    }else{
      this.messageWithLink = `<p style='margin-bottom:3px;'>Prodotto aggiunto al carrello con successo.</p> <a href="/carrito">Visualizza carrello</a>`;
    }
  }

  get paginas(): number[] {
    const total = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  irPagina(numero: number): void {
    this.page = numero;
    window.scrollTo({ top: 0 });
  }

  getProductosPaginados(): Producto[] {
    const startIndex = (this.page - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.productos.slice(startIndex, endIndex);
  }

  ngOnInit() {
    this.obtenerProductos();
    this.aplicarFiltro();
  }

  obtenerProductos() {
    this.spinner.show();
    this.productoService.getProductos().subscribe(productos => {
      this.productos = productos;
      this.productosIniciales = productos;
      this.totalItems = productos.length;
      this.spinner.hide();
    });
  }

  aplicarFiltro() {
    let productosFiltrados = this.productosIniciales.filter(producto =>
      producto.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())
    );

    productosFiltrados = productosFiltrados.filter(producto =>
      producto.precio >= this.minPrice && producto.precio <= this.maxPrice
    );

    productosFiltrados = productosFiltrados.filter(producto =>
      (this.selectedCategory === 'todas' || producto.categoria.startsWith(this.selectedCategory)) && // Filtra por categoría
      producto.precio >= this.minPrice && producto.precio <= this.maxPrice &&
      (!document.getElementById('stock') || (document.getElementById('stock') as HTMLInputElement).checked ? producto.stock > 0 : true)
    );

    if (this.ordenFecha === 'recientes') {
      productosFiltrados.sort((a, b) => new Date(b.fecha_lanzamiento).getTime() - new Date(a.fecha_lanzamiento).getTime());
    } else if (this.ordenFecha === 'antiguos') {
      productosFiltrados.sort((a, b) => new Date(a.fecha_lanzamiento).getTime() - new Date(b.fecha_lanzamiento).getTime());
    }

    this.totalItems = productosFiltrados.length;
    this.productos = productosFiltrados;
    this.page = 1;
  }

  verProducto(producto: Producto) {
    this.router.navigate(['producto'], { state: { producto } });
  }

  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregarProducto(producto); // Usa el servicio para añadir el producto

    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });

    Toast.fire({
      icon: "success",
      iconColor: "#bf4800",
      html: this.messageWithLink
    });
  }
}
