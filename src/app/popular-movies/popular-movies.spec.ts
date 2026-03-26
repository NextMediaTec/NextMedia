import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularMovies } from './popular-movies';

describe('PopularMovies', () => {
  let component: PopularMovies;
  let fixture: ComponentFixture<PopularMovies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularMovies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularMovies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
