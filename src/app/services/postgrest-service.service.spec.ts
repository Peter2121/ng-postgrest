import { TestBed, inject } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PostgrestServiceService } from './postgrest-service.service';

describe('PostgrestServiceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PostgrestServiceService]
    });
  });

  it('should be created', inject([PostgrestServiceService], (service: PostgrestServiceService) => {
    expect(service).toBeTruthy();
  }));
});
