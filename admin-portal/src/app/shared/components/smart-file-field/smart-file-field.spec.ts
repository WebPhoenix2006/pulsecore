import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartFileField } from './smart-file-field';

describe('SmartFileField', () => {
  let component: SmartFileField;
  let fixture: ComponentFixture<SmartFileField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmartFileField]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartFileField);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
