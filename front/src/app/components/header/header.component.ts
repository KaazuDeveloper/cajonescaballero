import { ChangeDetectorRef, Component, HostListener, NgZone, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LoginService } from '../../services/login.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-header',
  imports: [TranslatePipe, RouterLink],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  readonly enlaces = [
    { ruta: '/catalogo', clave: 'ui.nav.shop' },
    { ruta: '/personalizar', clave: 'ui.nav.make' },
    { ruta: '/tutoriales', clave: 'ui.nav.learn' },
    { ruta: '/sobreNosotros', clave: 'ui.nav.about' },
  ];
  totalProductos = 0;
  administrador = false;
  idioma = 'es';
  cuentaAbierta = false;
  menuAbierto = false;

  constructor(
    private carritoService: CarritoService,
    private translate: TranslateService,
    private router: Router,
    private authService: LoginService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.translate.addLangs(['en', 'es', 'it']);
    this.idioma = localStorage.getItem('appLang') || 'es';
    this.translate.setFallbackLang('es');
    this.translate.use(this.idioma);
    this.administrador = this.authService.isAdmin();
  }

  ngOnInit(): void {
    this.carritoService.obtenerCarrito().subscribe((carrito) => {
      this.totalProductos = carrito.reduce((total, item) => total + item.cantidad, 0);
    });
  }

  sesionIniciada(): boolean {
    return this.authService.isAuthenticated();
  }

  activo(ruta: string): boolean {
    const url = this.router.url;
    return url.startsWith(ruta) || (ruta === '/catalogo' && url.startsWith('/producto'));
  }

  alternarCuenta(evento: Event): void {
    evento.stopPropagation();
    this.menuAbierto = false;
    this.cuentaAbierta = !this.cuentaAbierta;
  }

  alternarMenu(evento: Event): void {
    evento.stopPropagation();
    this.cuentaAbierta = false;
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:click')
  cerrarMenus(): void {
    this.cuentaAbierta = false;
    this.menuAbierto = false;
  }

  cambiarIdioma(evento: Event): void {
    this.idioma = (evento.target as HTMLSelectElement).value;
    this.translate.use(this.idioma);
    localStorage.setItem('appLang', this.idioma);
  }

  cerrarSesion(): void {
    let confirmTitle, confirmButtonText, cancelButtonText;

    if (this.translate.getCurrentLang() === 'es') {
        confirmTitle = "¿Estás seguro de que quieres cerrar sesión?";
        confirmButtonText = "Sí";
        cancelButtonText = "No";
    } else if (this.translate.getCurrentLang() === 'en') {
        confirmTitle = "Are you sure you want to log out?";
        confirmButtonText = "Yes";
        cancelButtonText = "No";
    } else {
        confirmTitle = "Sei sicuro di voler uscire?";
        confirmButtonText = "Sì";
        cancelButtonText = "No";
    }

    Swal.fire({
        title: confirmTitle,
        icon: "warning",
        iconColor: "#bf4800",
        showCancelButton: true,
        confirmButtonColor: "#1d1d1f",
        cancelButtonColor: "#86868b",
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText
    }).then((result) => {
        if (result.isConfirmed) {
            this.authService.logout();
            this.router.navigate(['/']).then(() => {
                this.ngZone.onStable.asObservable().pipe(first()).subscribe(() => {
                    this.cd.detectChanges();
                    window.scrollTo(0, 0);
                    window.location.reload();
                });
            });
        }
    });
}
}
