import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TmdbService, TmdbSearchMultiResult } from '../services/tmdb.service';

@Component({
  selector: 'app-popular-movies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './popular-movies.html',
  styleUrl: './popular-movies.scss',
})
export class PopularMovies implements OnInit {

  public movies: TmdbSearchMultiResult[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public currentPage: number = 1;
  public totalPages: number = 1;

  constructor(
    private tmdbService: TmdbService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPopularMovies(1);
  }
  public loadPopularMovies(page: number): void {

    this.isLoading = true
    this.errorMessage = '';

    this.tmdbService.discoverMoviesAdvanced({
      page: page,
      language: 'en-US',
      sortBy: 'popularity.desc',
      voteCountGte: 100
    }).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.movies = (response.data.results || []).map((movie) => {
            return {
              ...movie,
              media_type: 'movie'
            };
          });

          this.currentPage = response.data.page || 1;
          this.totalPages = response.data.total_pages || 1;
        }else {
          this.errorMessage = 'Could not load popular movie';
        }

        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'An error occurred while loading popular movies';
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }

  public goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.loadPopularMovies(this.currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPopularMovies(this.currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public getPoster(movie: TmdbSearchMultiResult): string {
    const posterUrl = this.tmdbService.getPosterUrl(movie.poster_path, 'w500');

    if (posterUrl.trim().length > 0) {
      return posterUrl;
    }
    return 'https://via.placeholder.com/300x450?text=No+Image';
  }

  public getTitle(movie: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(movie);
  }

  public getReleaseYear(movie: TmdbSearchMultiResult): string {

    const date = this.tmdbService.getDisplayDate(movie);

    if (!date || date.trim().length < 4) {
      return 'Unknown';
    }
    return date.substring(0, 4);
  }
    public getRating(movie: TmdbSearchMultiResult): string {
      if (typeof movie.vote_average !== 'number') {
        return 'N/A';
      }
      return movie.vote_average.toFixed(1);
    }
    public trackByMovieId(index: number, movie: TmdbSearchMultiResult): number {
      return movie.id
    }
}
