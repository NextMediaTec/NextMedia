import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularSeries } from './popular-series';

describe('PopularSeries', () => {
  let component: PopularSeries;
  let fixture: ComponentFixture<PopularSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
