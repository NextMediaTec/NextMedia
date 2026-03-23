import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  BackendTmdbResponse,
  TmdbSearchMultiResponse,
  TmdbSearchMultiResult,
  TmdbService
} from '../../services/tmdb.service';

interface TopMovieItem extends TmdbSearchMultiResult {
  rank: number;
}

@Component({
  selector: 'app-top250-movies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top250-movies.html',
  styleUrl: './top250-movies.scss',
})
export class Top250Movies implements OnInit {
  public movies: TopMovieItem[] = [];

  public isLoading: boolean = false;
  public hasError: boolean = false;
  public errorMessage: string = '';

  constructor(
    public tmdbService: TmdbService,
    private router: Router
  ) {}

  public ngOnInit(): void {
    this.loadTop250Movies();
  }

  public openMovie(movieId: number): void {
    this.router.navigate(['/movie', movieId]);
  }

  public trackByMovieId(index: number, movie: TopMovieItem): number {
    return movie.id;
  }

  public getMovieTitle(movie: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(movie);
  }

  public getYear(dateString: string | undefined): string {
    if (!dateString) {
      return '';
    }

    return dateString.slice(0, 4);
  }

  public truncateText(text: string | undefined, maxLength: number): string {
    if (!text) {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
  }

  private loadTop250Movies(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const totalNeeded = 250;
    const totalPages = 13;

    const requests = Array.from({ length: totalPages }, (_, index: number) => {
      return this.tmdbService.getTopRatedMovies(index + 1);
    });

    forkJoin(requests).subscribe({
      next: (responses: BackendTmdbResponse<TmdbSearchMultiResponse>[]) => {
        const allMovies: TmdbSearchMultiResult[] = [];

        for (const response of responses) {
          if (!response || !response.success || !response.data || !Array.isArray(response.data.results)) {
            continue;
          }

          allMovies.push(...response.data.results);
        }

        const uniqueMovies = this.deduplicateMovies(allMovies);

        this.movies = uniqueMovies
          .slice(0, totalNeeded)
          .map((movie: TmdbSearchMultiResult, index: number) => {
            return {
              ...movie,
              rank: index + 1
            };
          });

        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.errorMessage = 'Error loading top movies.';
        this.isLoading = false;
      }
    });
  }

  private deduplicateMovies(movies: TmdbSearchMultiResult[]): TmdbSearchMultiResult[] {
    const seenIds = new Set<number>();
    const uniqueMovies: TmdbSearchMultiResult[] = [];

    for (const movie of movies) {
      if (!movie || !movie.id || seenIds.has(movie.id)) {
        continue;
      }

      seenIds.add(movie.id);
      uniqueMovies.push(movie);
    }

    return uniqueMovies;
  }
}