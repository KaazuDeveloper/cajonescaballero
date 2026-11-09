import { Component, ElementRef, Renderer2, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-sobre-nosotros',
    imports: [TranslatePipe],
    templateUrl: './sobre-nosotros.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './sobre-nosotros.component.css'
})
export class SobreNosotrosComponent {
  constructor(private renderer: Renderer2, private el: ElementRef) {

  }
  scrollToSection(sectionId: string): void {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      const offset = targetElement.offsetTop;
      this.renderer.setProperty(document.documentElement, 'scrollTop', offset);
    }
  }
}
