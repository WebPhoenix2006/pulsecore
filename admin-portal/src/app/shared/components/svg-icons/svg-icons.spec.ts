import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgIcons } from './svg-icons';

describe('SvgIcons', () => {
  let component: SvgIcons;
  let fixture: ComponentFixture<SvgIcons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SvgIcons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgIcons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
