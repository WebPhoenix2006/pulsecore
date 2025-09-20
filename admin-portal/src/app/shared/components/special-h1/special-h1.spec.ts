import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialH1 } from './special-h1';

describe('SpecialH1', () => {
  let component: SpecialH1;
  let fixture: ComponentFixture<SpecialH1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SpecialH1]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialH1);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
