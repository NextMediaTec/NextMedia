import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseByGenreSeries } from './browse-by-genre-series';

describe('BrowseByGenreSeries', () => {
  let component: BrowseByGenreSeries;
  let fixture: ComponentFixture<BrowseByGenreSeries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseByGenreSeries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowseByGenreSeries);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
