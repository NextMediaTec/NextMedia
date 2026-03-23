import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGenreSeries } from './show-genre-series';

describe('ShowGenreSeries', () => {
  let component: ShowGenreSeries;
  let fixture: ComponentFixture<ShowGenreSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowGenreSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowGenreSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
