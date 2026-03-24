import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowReleaseCalenderMonthsSeries } from './show-release-calender-months-series';

describe('ShowReleaseCalenderMonthsSeries', () => {
  let component: ShowReleaseCalenderMonthsSeries;
  let fixture: ComponentFixture<ShowReleaseCalenderMonthsSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowReleaseCalenderMonthsSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowReleaseCalenderMonthsSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
