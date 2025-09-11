import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradientBackground } from './gradient-background';

describe('GradientBackground', () => {
  let component: GradientBackground;
  let fixture: ComponentFixture<GradientBackground>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GradientBackground]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradientBackground);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
