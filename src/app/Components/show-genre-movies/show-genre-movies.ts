import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import {
  BackendTmdbResponse,
  TmdbGenre,
  TmdbMovieGenresResponse,
  TmdbSearchMultiResponse,
  TmdbSearchMultiResult,
  TmdbService
} from '../../services/tmdb.service';
import { MediaRatingSummary, ReviewsService } from '../../services/reviews.service';

interface RatedGenreMovie extends TmdbSearchMultiResult {
  ownAverageRating: number;
  ownRatingCount: number;
}

@Component({
  selector: 'app-show-genre-movies',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './show-genre-movies.html',
  styleUrl: './show-genre-movies.scss',
})
export class ShowGenreMovies implements OnInit, OnDestroy {
  public genreId: number = 0;
  public genreName: string = '';
  public heroMovie: TmdbSearchMultiResult | null = null;

  public popularMovies: TmdbSearchMultiResult[] = [];
  public latestMovies: TmdbSearchMultiResult[] = [];
  public customTopRatedMovies: RatedGenreMovie[] = [];

  public isLoading: boolean = false;
  public hasError: boolean = false;
  public errorMessage: string = '';

  private routeSubscription: Subscription | null = null;

  constructor(
    public tmdbService: TmdbService,
    private route: ActivatedRoute,
    private reviewsService: ReviewsService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const rawGenreId = Number(params.get('genreId') || 0);

      this.genreId = rawGenreId;

      if (!this.genreId) {
        this.finishWithError('Genre-id mangler.');
        return;
      }

      this.loadGenrePage();
    });
  }

  public ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
      this.routeSubscription = null;
    }
  }

  public getHeroImage(): string {
    if (!this.heroMovie) {
      return '';
    }

    if (this.heroMovie.backdrop_path) {
      return this.tmdbService.getBackdropUrl(this.heroMovie.backdrop_path, 'w1280');
    }

    return this.tmdbService.getPosterUrl(this.heroMovie.poster_path, 'w500');
  }

  public getPosterUrl(path: string | null): string {
    return this.tmdbService.getPosterUrl(path, 'w500');
  }

  public getDisplayTitle(movie: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(movie);
  }

  public getDisplayYear(movie: TmdbSearchMultiResult): string {
    const rawDate = this.tmdbService.getDisplayDate(movie);

    if (!rawDate || rawDate.trim().length < 4) {
      return '';
    }

    return rawDate.slice(0, 4);
  }

  public formatOwnRating(value: number): string {
    return Number(value || 0).toFixed(1);
  }

  public trackByMovieId(index: number, movie: TmdbSearchMultiResult): number {
    return movie.id;
  }

  private loadGenrePage(): void {
    this.genreName = '';
    this.heroMovie = null;
    this.popularMovies = [];
    this.latestMovies = [];
    this.customTopRatedMovies = [];
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    const today = this.getTodayDateString();

    const popularRequests = [
      this.tmdbService.discoverMoviesAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      })
    ];

    const latestRequests = [
      this.tmdbService.discoverMoviesAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'primary_release_date.desc',
        releaseDateLte: today
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'primary_release_date.desc',
        releaseDateLte: today
      })
    ];

    const ratingCandidateRequests = [
      this.tmdbService.discoverMoviesAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 3,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 4,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 5,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        releaseDateLte: today
      })
    ];

    forkJoin({
      genreResponse: this.tmdbService.getMovieGenres(),
      popularResponses: forkJoin(popularRequests),
      latestResponses: forkJoin(latestRequests),
      ratingCandidateResponses: forkJoin(ratingCandidateRequests)
    }).subscribe({
      next: async ({
        genreResponse,
        popularResponses,
        latestResponses,
        ratingCandidateResponses
      }: {
        genreResponse: BackendTmdbResponse<TmdbMovieGenresResponse>;
        popularResponses: BackendTmdbResponse<TmdbSearchMultiResponse>[];
        latestResponses: BackendTmdbResponse<TmdbSearchMultiResponse>[];
        ratingCandidateResponses: BackendTmdbResponse<TmdbSearchMultiResponse>[];
      }) => {
        try {
          if (!genreResponse.success || !genreResponse.data || !Array.isArray(genreResponse.data.genres)) {
            this.finishWithError('Der opstod en fejl under hentning af genredata.');
            return;
          }

          const foundGenre = genreResponse.data.genres.find((genre: TmdbGenre) => {
            return genre.id === this.genreId;
          });

          this.genreName = foundGenre ? foundGenre.name : 'Genre';

          const popularMovies = this.flattenMovieResponses(popularResponses).slice(0, 25);
          const latestMovies = this.flattenMovieResponses(latestResponses).slice(0, 25);
          const ratingCandidates = this.flattenMovieResponses(ratingCandidateResponses);

          this.popularMovies = popularMovies;
          this.latestMovies = latestMovies;
          this.heroMovie = popularMovies.length > 0 ? popularMovies[0] : (latestMovies.length > 0 ? latestMovies[0] : null);

          const ratingsMap = await this.reviewsService.getAverageRatingsForMediaIds(
            'movie',
            ratingCandidates.map((movie: TmdbSearchMultiResult) => movie.id)
          );

          const ratedCandidates: RatedGenreMovie[] = ratingCandidates
            .map((movie: TmdbSearchMultiResult) => {
              const ratingSummary: MediaRatingSummary | undefined = ratingsMap[movie.id];

              return {
                ...movie,
                ownAverageRating: ratingSummary ? ratingSummary.averageRating : 0,
                ownRatingCount: ratingSummary ? ratingSummary.reviewCount : 0
              };
            })
            .filter((movie: RatedGenreMovie) => movie.ownRatingCount > 0)
            .sort((a: RatedGenreMovie, b: RatedGenreMovie) => {
              if (b.ownAverageRating !== a.ownAverageRating) {
                return b.ownAverageRating - a.ownAverageRating;
              }

              if (b.ownRatingCount !== a.ownRatingCount) {
                return b.ownRatingCount - a.ownRatingCount;
              }

              return Number(b.popularity || 0) - Number(a.popularity || 0);
            })
            .slice(0, 25);

          this.customTopRatedMovies = ratedCandidates;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        } catch (error) {
          this.customTopRatedMovies = [];
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      },
      error: () => {
        this.finishWithError('Der opstod en fejl under hentning af genre-film.');
      }
    });
  }

  private flattenMovieResponses(
    responses: BackendTmdbResponse<TmdbSearchMultiResponse>[]
  ): TmdbSearchMultiResult[] {
    const merged: TmdbSearchMultiResult[] = [];

    for (const response of responses) {
      if (!response || !response.success || !response.data || !Array.isArray(response.data.results)) {
        continue;
      }

      for (const item of response.data.results) {
        if (item.media_type !== 'movie') {
          continue;
        }

        merged.push(item);
      }
    }

    const uniqueMap = new Map<number, TmdbSearchMultiResult>();

    for (const movie of merged) {
      if (!uniqueMap.has(movie.id)) {
        uniqueMap.set(movie.id, movie);
      }
    }

    return Array.from(uniqueMap.values());
  }

  private finishWithError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
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