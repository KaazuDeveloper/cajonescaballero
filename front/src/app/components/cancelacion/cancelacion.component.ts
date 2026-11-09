import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CarritoService } from '../../services/carrito.service';

@Component({
    selector: 'app-cancelacion',
    imports: [TranslatePipe, RouterLink],
    templateUrl: './cancelacion.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './cancelacion.component.css'
})
export class CancelacionComponent implements OnInit{
  constructor(private carritoService: CarritoService) {}

  ngOnInit(): void {
    this.carritoService.borrarCompra();
  }
}
