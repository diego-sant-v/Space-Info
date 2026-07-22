import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackHoleComponent } from './black-hole.component';

describe('BlackHoleComponent', () => {
  let component: BlackHoleComponent;
  let fixture: ComponentFixture<BlackHoleComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BlackHoleComponent]
    });
    fixture = TestBed.createComponent(BlackHoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
