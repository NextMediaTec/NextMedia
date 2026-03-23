import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowseByGenreMovies } from './browse-by-genre-movies';

describe('BrowseByGenreMovies', () => {
  let component: BrowseByGenreMovies;
  let fixture: ComponentFixture<BrowseByGenreMovies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseByGenreMovies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrowseByGenreMovies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
