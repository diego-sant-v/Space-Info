import { TestBed } from '@angular/core/testing';

import { AsteroidesNeoService } from './asteroides-neo.service';

describe('AsteroidesNeoService', () => {
  let service: AsteroidesNeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AsteroidesNeoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
