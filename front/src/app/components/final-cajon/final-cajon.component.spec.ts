import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalCajonComponent } from './final-cajon.component';

describe('FinalCajonComponent', () => {
  let component: FinalCajonComponent;
  let fixture: ComponentFixture<FinalCajonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalCajonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FinalCajonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
