import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { delay } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SpinnerService } from './services/spinner-service.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SpinnerComponent, AsyncPipe, TranslatePipe],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly demo = environment.demo;
  /* Pages toggle the spinner while they initialise, after this template has been checked. */
  readonly cargando$ = inject(SpinnerService).isVisible().pipe(delay(0));
}
