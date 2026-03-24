import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowReleaseCalenderMonths } from './show-release-calender-months';

describe('ShowReleaseCalenderMonths', () => {
  let component: ShowReleaseCalenderMonths;
  let fixture: ComponentFixture<ShowReleaseCalenderMonths>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowReleaseCalenderMonths]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowReleaseCalenderMonths);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
