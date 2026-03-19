import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseCalenderSeries } from './release-calender-series';

describe('ReleaseCalenderSeries', () => {
  let component: ReleaseCalenderSeries;
  let fixture: ComponentFixture<ReleaseCalenderSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseCalenderSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleaseCalenderSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
