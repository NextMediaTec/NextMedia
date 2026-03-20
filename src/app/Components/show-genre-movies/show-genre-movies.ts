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
import { WatchlistButtonComponent } from '../../watchlist-button/watchlist-button';

interface RatedGenreMovie extends TmdbSearchMultiResult {
  ownAverageRating: number;
  ownRatingCount: number;
}

@Component({
  selector: 'app-show-genre-movies',
  standalone: true,
  imports: [CommonModule, RouterLink, WatchlistButtonComponent],
  templateUrl: './show-genre-movies.html',
  styleUrl: './show-genre-movies.scss',
})
export class ShowGenreMovies implements OnInit, OnDestroy {
  public genreId: number = 0;
  public genreName: string = '';
  public heroMovie: TmdbSearchMultiResult | null = null;

  public popularMovies: TmdbSearchMultiResult[] = [];
  public latestMovies: TmdbSearchMultiResult[] = [];
  public upcomingMovies: TmdbSearchMultiResult[] = [];
  public customTopRatedMovies: RatedGenreMovie[] = [];

  public isLoading: boolean = false;
  public hasError: boolean = false;
  public errorMessage: string = '';

  private routeSubscription: Subscription | null = null;
  private ratingsMap: Record<number, MediaRatingSummary> = {};

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

  public getDisplayReleaseDate(movie: TmdbSearchMultiResult): string {
    const rawDate = this.tmdbService.getDisplayDate(movie);

    if (!rawDate || rawDate.trim().length === 0) {
      return 'Ukendt dato';
    }

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return rawDate;
    }

    return parsedDate.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  public getOverview(movie: TmdbSearchMultiResult): string {
    const overview = String(movie.overview || '').trim();

    if (overview.length === 0) {
      return 'Ingen beskrivelse endnu.';
    }

    return overview;
  }

  public getOwnAverageRating(movieId: number): string {
    const summary = this.ratingsMap[movieId];

    if (!summary || summary.reviewCount <= 0) {
      return 'Ingen ratings endnu';
    }

    return `${summary.averageRating.toFixed(1)}/5`;
  }

  public getOwnReviewCount(movieId: number): number {
    const summary = this.ratingsMap[movieId];

    if (!summary) {
      return 0;
    }

    return summary.reviewCount;
  }

  public hasOwnRating(movieId: number): boolean {
    const summary = this.ratingsMap[movieId];

    if (!summary) {
      return false;
    }

    return summary.reviewCount > 0;
  }

  public formatOwnRating(value: number): string {
    return Number(value || 0).toFixed(1);
  }

  public trackByMovieId(index: number, movie: TmdbSearchMultiResult): number {
    return movie.id;
  }

  public getFeaturedStandardMovies(movies: TmdbSearchMultiResult[]): TmdbSearchMultiResult[] {
    return movies.slice(0, 3);
  }

  public getRemainingStandardMovies(movies: TmdbSearchMultiResult[]): TmdbSearchMultiResult[] {
    return movies.slice(3);
  }

  public getFeaturedRatedMovies(movies: RatedGenreMovie[]): RatedGenreMovie[] {
    return movies.slice(0, 3);
  }

  public getRemainingRatedMovies(movies: RatedGenreMovie[]): RatedGenreMovie[] {
    return movies.slice(3);
  }

  private loadGenrePage(): void {
    this.genreName = '';
    this.heroMovie = null;
    this.popularMovies = [];
    this.latestMovies = [];
    this.upcomingMovies = [];
    this.customTopRatedMovies = [];
    this.ratingsMap = {};
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    const today = this.getTodayDateString();
    const threeMonthsFromToday = this.getDateStringMonthsFromNow(3);

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

    const upcomingRequests = [
      this.tmdbService.discoverMoviesAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'primary_release_date.asc',
        releaseDateGte: today,
        releaseDateLte: threeMonthsFromToday
      }),
      this.tmdbService.discoverMoviesAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'primary_release_date.asc',
        releaseDateGte: today,
        releaseDateLte: threeMonthsFromToday
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
      upcomingResponses: forkJoin(upcomingRequests),
      ratingCandidateResponses: forkJoin(ratingCandidateRequests)
    }).subscribe({
      next: async ({
        genreResponse,
        popularResponses,
        latestResponses,
        upcomingResponses,
        ratingCandidateResponses
      }: {
        genreResponse: BackendTmdbResponse<TmdbMovieGenresResponse>;
        popularResponses: BackendTmdbResponse<TmdbSearchMultiResponse>[];
        latestResponses: BackendTmdbResponse<TmdbSearchMultiResponse>[];
        upcomingResponses: BackendTmdbResponse<TmdbSearchMultiResponse>[];
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
          const latestMovies = this.flattenMovieResponses(latestResponses)
            .filter((movie: TmdbSearchMultiResult) => this.isReleasedInOrBeforeYear(movie, 2027))
            .slice(0, 25);
          const upcomingMovies = this.flattenMovieResponses(upcomingResponses)
            .filter((movie: TmdbSearchMultiResult) => this.isUpcomingWithinNextThreeMonths(movie))
            .slice(0, 25);
          const ratingCandidates = this.flattenMovieResponses(ratingCandidateResponses);

          this.popularMovies = popularMovies;
          this.latestMovies = latestMovies;
          this.upcomingMovies = upcomingMovies;
          this.heroMovie = popularMovies.length > 0
            ? popularMovies[0]
            : (latestMovies.length > 0 ? latestMovies[0] : (upcomingMovies.length > 0 ? upcomingMovies[0] : null));

          const allMovieIds = Array.from(
            new Set(
              [
                ...popularMovies.map((movie: TmdbSearchMultiResult) => movie.id),
                ...latestMovies.map((movie: TmdbSearchMultiResult) => movie.id),
                ...upcomingMovies.map((movie: TmdbSearchMultiResult) => movie.id),
                ...ratingCandidates.map((movie: TmdbSearchMultiResult) => movie.id)
              ]
            )
          );

          this.ratingsMap = await this.reviewsService.getAverageRatingsForMediaIds(
            'movie',
            allMovieIds
          );

          const ratedCandidates: RatedGenreMovie[] = ratingCandidates
            .map((movie: TmdbSearchMultiResult) => {
              const ratingSummary: MediaRatingSummary | undefined = this.ratingsMap[movie.id];

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

  private isReleasedInOrBeforeYear(movie: TmdbSearchMultiResult, maxYear: number): boolean {
    const rawDate = this.tmdbService.getDisplayDate(movie);

    if (!rawDate || rawDate.trim().length < 4) {
      return false;
    }

    const parsedDate = new Date(rawDate);

    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.getFullYear() <= maxYear;
    }

    const parsedYear = Number(rawDate.slice(0, 4));

    if (Number.isNaN(parsedYear)) {
      return false;
    }

    return parsedYear <= maxYear;
  }

  private isUpcomingWithinNextThreeMonths(movie: TmdbSearchMultiResult): boolean {
    const parsedDate = this.parseMovieDate(movie);

    if (!parsedDate) {
      return false;
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const threeMonthsAhead = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

    return parsedDate >= todayStart && parsedDate <= threeMonthsAhead;
  }

  private parseMovieDate(movie: TmdbSearchMultiResult): Date | null {
    const rawDate = this.tmdbService.getDisplayDate(movie);

    if (!rawDate || rawDate.trim().length === 0) {
      return null;
    }

    const safeRawDate = rawDate.trim();
    const match = safeRawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        return null;
      }

      return new Date(year, month - 1, day);
    }

    const parsedDate = new Date(safeRawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
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

  private getDateStringMonthsFromNow(monthsToAdd: number): string {
    const now = new Date();
    const futureDate = new Date(now.getFullYear(), now.getMonth() + monthsToAdd, now.getDate());
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}