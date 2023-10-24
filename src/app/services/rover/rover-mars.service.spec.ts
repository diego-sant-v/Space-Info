import { TestBed } from '@angular/core/testing';

import { RoverMarsService } from './rover-mars.service';

describe('RoverMarsService', () => {
  let service: RoverMarsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoverMarsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
