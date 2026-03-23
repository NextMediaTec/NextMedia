import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowGenreMovies } from './show-genre-movies';

describe('ShowGenreMovies', () => {
  let component: ShowGenreMovies;
  let fixture: ComponentFixture<ShowGenreMovies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowGenreMovies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowGenreMovies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
