import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Producto } from '../../interfaces/producto';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { marcaService } from '../../services/marca.service';
import { Comentario } from '../../interfaces/comentario';
import { comentarioService } from '../../services/comentario.service';
import { usuarioService } from '../../services/usuario.service';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import Swal from 'sweetalert2';
import { StripeService } from '../../services/stripe.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SpinnerService } from '../../services/spinner-service.service';

@Component({
    selector: 'app-producto',
    imports: [DatePipe, DecimalPipe, FormsModule, TranslatePipe, RouterLink],
    templateUrl: './producto.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './producto.component.css'
})
export class ProductoComponent {
  producto?: Producto;
  nombreMarca?: string;
  comentarios?: Comentario[];
  nuevoComentario: string = '';
  messageWithLink?: string;

  constructor(private router: Router, private stripeService : StripeService,private route: ActivatedRoute, private marcas : marcaService, private comentariosService : comentarioService, private translate: TranslateService, public loginService : LoginService, private spinner : SpinnerService) {
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

  ngOnInit(): void {
    if (typeof history !== 'undefined') {
      const navigationState = history.state;

      if (navigationState && navigationState.producto) {
        this.producto = navigationState.producto;
      }

      if (!this.producto) {
        this.router.navigate(['/catalogo']);
        return;
      }

      if (this.producto?.marca_id) {
        this.spinner.show();
        this.marcas.getMarca(this.producto?.marca_id)
        .subscribe(nombre => {
          this.nombreMarca = nombre.nombre;
        });

        this.comentariosService.getComentariosProducto(this.producto?._id)
        .subscribe(comentarios => {
          this.comentarios = comentarios;
          this.spinner.hide();
        });
      }
    }
  }

    agregarAlCarrito(producto: any): void {
      let carritoStr = localStorage.getItem('carrito');
      if (carritoStr !== null) {
        let carrito = JSON.parse(carritoStr);

        let index = carrito.findIndex((item: any) => item.producto.id === producto.id);

        if (index !== -1) {
          carrito[index].cantidad++;
        } else {
          carrito.push({ producto: producto, cantidad: 1 });
        }

        localStorage.setItem('carrito', JSON.stringify(carrito));
      } else {
        let carrito = [{ producto: producto, cantidad: 1 }];
        localStorage.setItem('carrito', JSON.stringify(carrito));
      }
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

  enviarComentario(): void {
    if (this.nuevoComentario.trim() !== '') {
      if (this.loginService.isAuthenticated()) {
        this.comentarios?.unshift({ nombreUsuario: sessionStorage.getItem('username') || "", texto: this.nuevoComentario ,producto_id: "" , usuario_id: "", fecha : new Date ()})

      const nuevoComentario = {
        nombreUsuario: sessionStorage.getItem('username') || "",
        texto: this.nuevoComentario || "",
        producto_id: this.producto?._id || "",
        usuario_id: sessionStorage.getItem('userId') || ""
      }

      this.comentariosService.addComentario(nuevoComentario).subscribe(
        error => {
        }
      );
      this.nuevoComentario = '';
      }else{
        Swal.fire({
          icon: 'error',
          iconColor: "#bf4800",
          title: 'Error',
          confirmButtonColor: "#1d1d1f",
          text: 'Inicia sesion para enviar un comentario.'
        });
      }
    }
  }

  comprar(productoRecibido : Producto):void {
    let producto = {
      nombre: productoRecibido.nombre,
      descripcion: productoRecibido.descripcion,
      precio: productoRecibido.precio,
      cantidad: 1,
      id : productoRecibido._id,
      imagen_url :  productoRecibido.imagen_url
    }
    localStorage.setItem('compra', JSON.stringify(producto));

    this.stripeService.procesarPago({ items: [{ id: productoRecibido._id!, cantidad: 1 }] });
  }
}
