import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-politica',
    imports: [TranslatePipe, RouterLink],
    templateUrl: './politica.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './politica.component.css'
})
export class PoliticaComponent {

}
