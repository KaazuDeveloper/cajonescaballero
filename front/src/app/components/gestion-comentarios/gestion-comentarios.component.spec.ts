import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionComentariosComponent } from './gestion-comentarios.component';

describe('GestionComentariosComponent', () => {
  let component: GestionComentariosComponent;
  let fixture: ComponentFixture<GestionComentariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionComentariosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GestionComentariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
