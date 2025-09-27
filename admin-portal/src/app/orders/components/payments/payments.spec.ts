import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Payments } from './payments';

describe('Payments', () => {
  let component: Payments;
  let fixture: ComponentFixture<Payments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Payments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Payments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
