import { Routes } from '@angular/router';
import { PermissionsService } from './guard/auth-guard.guard';
import { AdminPermissionsService } from './guard/admin-guard.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((c) => c.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register.component').then((c) => c.RegisterComponent),
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./components/catalogo/catalogo.component').then((c) => c.CatalogoComponent),
  },
  {
    path: 'catalogo/:id',
    loadComponent: () =>
      import('./components/catalogo/catalogo.component').then((c) => c.CatalogoComponent),
  },
  {
    path: 'personalizar',
    loadComponent: () =>
      import('./components/personalizar/personalizar.component').then((c) => c.PersonalizarComponent),
  },
  {
    path: 'personalizar/pintar',
    loadComponent: () =>
      import('./components/pintar/pintar.component').then((c) => c.PintarComponent),
  },
  {
    path: 'carrito',
    canActivate: [PermissionsService],
    loadComponent: () =>
      import('./components/carrito/carrito.component').then((c) => c.CarritoComponent),
  },
  {
    path: 'pedidos',
    canActivate: [PermissionsService],
    loadComponent: () =>
      import('./components/pedidos/pedidos.component').then((c) => c.PedidosComponent),
  },
  {
    path: 'gestionPedidos',
    canActivate: [AdminPermissionsService],
    loadComponent: () =>
      import('./components/gestion-pedidos/gestion-pedidos.component').then((c) => c.GestionPedidosComponent),
  },
  {
    path: 'gestionProductos',
    canActivate: [AdminPermissionsService],
    loadComponent: () =>
      import('./components/gestion-productos/gestion-productos.component').then((c) => c.GestionProductosComponent),
  },
  {
    path: 'gestionComentarios',
    canActivate: [AdminPermissionsService],
    loadComponent: () =>
      import('./components/gestion-comentarios/gestion-comentarios.component').then((c) => c.GestionComentariosComponent),
  },
  {
    path: 'producto',
    loadComponent: () =>
      import('./components/producto/producto.component').then((c) => c.ProductoComponent),
  },
  {
    path: 'tutoriales',
      loadComponent: () =>
      import('./components/tutoriales/tutoriales.component').then((c) => c.TutorialesComponent),
  },
  {
    path: 'personalizar/finalizar',
      loadComponent: () =>
      import('./components/final-cajon/final-cajon.component').then((c) => c.FinalCajonComponent),
  },
  {
    path: 'exito',
    canActivate: [PermissionsService],
      loadComponent: () =>
      import('./components/exito/exito.component').then((c) => c.ExitoComponent),
  },
  {
    path: 'perfil',
    canActivate: [PermissionsService],
      loadComponent: () =>
      import('./components/perfil/perfil.component').then((c) => c.PerfilComponent),
  },
  {
    path: 'sobreNosotros',
      loadComponent: () =>
      import('./components/sobre-nosotros/sobre-nosotros.component').then((c) => c.SobreNosotrosComponent),
  },
  {
    path: 'politica',
      loadComponent: () =>
      import('./components/politica/politica.component').then((c) => c.PoliticaComponent),
  },
  {
    path: 'legal',
      loadComponent: () =>
      import('./components/legal/legal.component').then((c) => c.LegalComponent),
  },
  {
    path: 'privacidad',
      loadComponent: () =>
      import('./components/privacidad/privacidad.component').then((c) => c.PrivacidadComponent),
  },
  {
    path: 'cancelacion',
    canActivate: [PermissionsService],
      loadComponent: () =>
      import('./components/cancelacion/cancelacion.component').then((c) => c.CancelacionComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./components/pagina404/pagina404.component').then((c) => c.Pagina404Component),
  },
];
