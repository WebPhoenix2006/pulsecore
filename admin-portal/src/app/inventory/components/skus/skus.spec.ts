import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Skus } from './skus';

describe('Skus', () => {
  let component: Skus;
  let fixture: ComponentFixture<Skus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Skus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Skus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
