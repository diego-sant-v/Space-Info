import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerraComponent } from './terra.component';

describe('TerraComponent', () => {
  let component: TerraComponent;
  let fixture: ComponentFixture<TerraComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TerraComponent]
    });
    fixture = TestBed.createComponent(TerraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
