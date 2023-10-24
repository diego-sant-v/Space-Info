import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsteroidesComponent } from './asteroides.component';

describe('AsteroidesComponent', () => {
  let component: AsteroidesComponent;
  let fixture: ComponentFixture<AsteroidesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AsteroidesComponent]
    });
    fixture = TestBed.createComponent(AsteroidesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
