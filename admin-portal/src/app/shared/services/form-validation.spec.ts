import { FormValidation } from './form-validation.service';
import { TestBed } from '@angular/core/testing';

describe('FormValidation', () => {
  let service: FormValidation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormValidation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
