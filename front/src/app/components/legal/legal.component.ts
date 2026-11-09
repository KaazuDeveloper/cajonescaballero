import { environment } from '../../../environments/environment';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-legal',
    imports: [TranslatePipe, RouterLink],
    templateUrl: './legal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './legal.component.css'
})
export class LegalComponent {
  readonly demo = environment.demo;

}
