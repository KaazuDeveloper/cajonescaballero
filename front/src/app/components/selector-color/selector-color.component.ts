import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

const COLORES = ['#1d1d1f', '#ffffff', '#b3261e', '#bf4800', '#e0a100', '#1f7a4d', '#1d4ed8', '#7a1f5c'];

/* Colour swatches plus a free colour picker. `previa` fires while dragging in the picker. */
@Component({
  selector: 'app-selector-color',
  template: `
    @for (color of colores; track color) {
      <button
        type="button"
        class="muestra"
        [class.on]="color === valor"
        [style.background]="color"
        [attr.aria-label]="color"
        (click)="cambio.emit(color)"
      ></button>
    }
    <label class="libre" [class.on]="!colores.includes(valor)" [title]="etiqueta">
      <input type="color" [value]="valor" [attr.aria-label]="etiqueta" (input)="previa.emit($any($event.target).value)" (change)="cambio.emit($any($event.target).value)" />
    </label>
  `,
  styles: `
    :host { display: flex; flex-wrap: wrap; gap: 8px; }
    .muestra, .libre { width: 30px; height: 30px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .14); cursor: pointer; }
    .on { outline: 2px solid var(--ink); outline-offset: 2px; }
    .libre { position: relative; overflow: hidden; background: conic-gradient(#e0342b, #e0a100, #1f7a4d, #1d4ed8, #7a1f5c, #e0342b); }
    .libre input { position: absolute; inset: -6px; width: 44px; height: 44px; padding: 0; border: 0; opacity: 0; cursor: pointer; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorColorComponent {
  readonly colores = COLORES;
  @Input() valor = '#1d1d1f';
  @Input() etiqueta = 'Otro color';
  @Output() cambio = new EventEmitter<string>();
  @Output() previa = new EventEmitter<string>();
}
