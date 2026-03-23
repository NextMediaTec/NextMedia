import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseCalenderMovies } from './release-calender-movies';

describe('ReleaseCalenderMovies', () => {
  let component: ReleaseCalenderMovies;
  let fixture: ComponentFixture<ReleaseCalenderMovies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseCalenderMovies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleaseCalenderMovies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
