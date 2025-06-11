import { TestBed } from '@angular/core/testing';

import { KycService } from './kyc.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('KycService', () => {
  let service: KycService;

  beforeEach(() => {
    TestBed.configureTestingModule({
       providers: [provideHttpClientTesting()]
    });
    service = TestBed.inject(KycService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
