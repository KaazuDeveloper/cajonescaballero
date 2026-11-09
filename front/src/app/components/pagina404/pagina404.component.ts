import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-pagina404',
    imports: [RouterLink, TranslatePipe],
    templateUrl: './pagina404.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './pagina404.component.css'
})
export class Pagina404Component {

}
