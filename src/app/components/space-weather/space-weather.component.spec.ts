import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceWeatherComponent } from './space-weather.component';

describe('SpaceWeatherComponent', () => {
  let component: SpaceWeatherComponent;
  let fixture: ComponentFixture<SpaceWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpaceWeatherComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpaceWeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
