import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarsRoverComponent } from './mars-rover.component';

describe('MarsRoverComponent', () => {
  let component: MarsRoverComponent;
  let fixture: ComponentFixture<MarsRoverComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MarsRoverComponent]
    });
    fixture = TestBed.createComponent(MarsRoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
