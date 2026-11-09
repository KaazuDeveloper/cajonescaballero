import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-privacidad',
    imports: [TranslatePipe, RouterLink],
    templateUrl: './privacidad.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './privacidad.component.css'
})
export class PrivacidadComponent {

}
