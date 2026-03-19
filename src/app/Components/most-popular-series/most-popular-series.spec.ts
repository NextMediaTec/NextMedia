import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostPopularSeries } from './most-popular-series';

describe('MostPopularSeries', () => {
  let component: MostPopularSeries;
  let fixture: ComponentFixture<MostPopularSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostPopularSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MostPopularSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
