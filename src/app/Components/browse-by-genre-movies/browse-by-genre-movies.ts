import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  BackendTmdbResponse,
  TmdbGenre,
  TmdbMovieGenresResponse,
  TmdbSearchMultiResponse,
  TmdbSearchMultiResult,
  TmdbService
} from '../../services/tmdb.service';

interface GenreBrowseCard {
  genreId: number;
  genreName: string;
  imagePath: string | null;
  backdropPath: string | null;
  sampleMovieTitle: string;
  movieCount: number;
}

@Component({
  selector: 'app-browse-by-genre-movies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browse-by-genre-movies.html',
  styleUrl: './browse-by-genre-movies.scss',
})
export class BrowseByGenreMovies implements OnInit {
  public genres: TmdbGenre[] = [];
  public genreCards: GenreBrowseCard[] = [];

  public isLoadingGenres: boolean = false;
  public isLoadingCards: boolean = false;
  public hasError: boolean = false;
  public errorMessage: string = '';

  constructor(
    public tmdbService: TmdbService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.loadGenresAndCards();
  }

  public openGenre(genreId: number): void {
    this.router.navigate(['/show-genre-movies', genreId]);
  }

  public getCardImage(card: GenreBrowseCard): string {
    if (card.backdropPath) {
      return this.tmdbService.getBackdropUrl(card.backdropPath, 'w780');
    }

    return this.tmdbService.getPosterUrl(card.imagePath, 'w500');
  }

  public trackByGenreId(index: number, card: GenreBrowseCard): number {
    return card.genreId;
  }

  private loadGenresAndCards(): void {
    this.isLoadingGenres = true;
    this.isLoadingCards = true;
    this.hasError = false;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    this.tmdbService.getMovieGenres().subscribe({
      next: (genreResponse: BackendTmdbResponse<TmdbMovieGenresResponse>) => {
        if (!genreResponse.success || !genreResponse.data || !Array.isArray(genreResponse.data.genres)) {
          this.finishWithError('Der opstod en fejl under hentning af movie genres.');
          return;
        }

        this.genres = [...genreResponse.data.genres].sort((a: TmdbGenre, b: TmdbGenre) => {
          return a.name.localeCompare(b.name);
        });

        this.isLoadingGenres = false;
        this.changeDetectorRef.detectChanges();

        this.loadGenreCards();
      },
      error: () => {
        this.finishWithError('Der opstod en fejl under hentning af movie genres.');
      }
    });
  }

  private loadGenreCards(): void {
    if (this.genres.length === 0) {
      this.genreCards = [];
      this.isLoadingCards = false;
      this.changeDetectorRef.detectChanges();
      return;
    }

    const today = this.getTodayDateString();

    const requests = this.genres.map((genre) => {
      return this.tmdbService.discoverMoviesAdvanced({
        page: 1,
        withGenres: String(genre.id),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      });
    });

    forkJoin(requests).subscribe({
      next: (responses: BackendTmdbResponse<TmdbSearchMultiResponse>[]) => {
        const cards: GenreBrowseCard[] = [];

        for (let i = 0; i < this.genres.length; i++) {
          const genre = this.genres[i];
          const response = responses[i];

          if (!response || !response.success || !response.data || !Array.isArray(response.data.results)) {
            continue;
          }

          const results = response.data.results.filter((item: TmdbSearchMultiResult) => {
            return item.media_type === 'movie';
          });

          if (results.length === 0) {
            continue;
          }

          const heroMovie = results[0];

          cards.push({
            genreId: genre.id,
            genreName: genre.name,
            imagePath: heroMovie.poster_path || null,
            backdropPath: heroMovie.backdrop_path || null,
            sampleMovieTitle: this.tmdbService.getDisplayTitle(heroMovie),
            movieCount: Number(response.data.total_results || results.length)
          });
        }

        this.genreCards = cards;
        this.isLoadingCards = false;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.finishWithError('Der opstod en fejl under hentning af genre-kort.');
      }
    });
  }

  private finishWithError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoadingGenres = false;
    this.isLoadingCards = false;
    this.changeDetectorRef.detectChanges();
  }

  private getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}