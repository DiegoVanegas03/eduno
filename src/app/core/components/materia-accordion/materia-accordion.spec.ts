import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MateriaAccordion } from './materia-accordion';

describe('MateriaAccordion', () => {
  let component: MateriaAccordion;
  let fixture: ComponentFixture<MateriaAccordion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MateriaAccordion],
    }).compileComponents();

    fixture = TestBed.createComponent(MateriaAccordion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
