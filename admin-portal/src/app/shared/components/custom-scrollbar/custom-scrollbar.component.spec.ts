import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomScrollbarComponent } from './custom-scrollbar.component';

describe('CustomScrollbarComponent', () => {
  let component: CustomScrollbarComponent;
  let fixture: ComponentFixture<CustomScrollbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomScrollbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomScrollbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});