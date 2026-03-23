import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import {
  BackendTmdbResponse,
  TmdbGenre,
  TmdbTvGenresResponse,
  TmdbSearchMultiResponse,
  TmdbSearchMultiResult,
  TmdbService
} from '../../services/tmdb.service';
import { MediaRatingSummary, ReviewsService } from '../../services/reviews.service';
import { WatchlistButtonComponent } from '../../watchlist-button/watchlist-button';

interface RatedGenreSeries extends TmdbSearchMultiResult {
  ownAverageRating: number;
  ownRatingCount: number;
}

@Component({
  selector: 'app-show-genre-series',
  standalone: true,
  imports: [CommonModule, RouterLink, WatchlistButtonComponent],
  templateUrl: './show-genre-series.html',
  styleUrl: './show-genre-series.scss',
})
export class ShowGenreSeries implements OnInit, OnDestroy {
  public genreId: number = 0;
  public genreName: string = '';
  public heroSeries: TmdbSearchMultiResult | null = null;

  public popularSeries: TmdbSearchMultiResult[] = [];
  public latestSeries: TmdbSearchMultiResult[] = [];
  public upcomingSeries: TmdbSearchMultiResult[] = [];
  public customTopRatedSeries: RatedGenreSeries[] = [];

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
    if (!this.heroSeries) {
      return '';
    }

    if (this.heroSeries.backdrop_path) {
      return this.tmdbService.getBackdropUrl(this.heroSeries.backdrop_path, 'w1280');
    }

    return this.tmdbService.getPosterUrl(this.heroSeries.poster_path, 'w500');
  }

  public getPosterUrl(path: string | null): string {
    return this.tmdbService.getPosterUrl(path, 'w500');
  }

  public getDisplayTitle(series: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(series);
  }

  public getDisplayYear(series: TmdbSearchMultiResult): string {
    const rawDate = this.tmdbService.getDisplayDate(series);

    if (!rawDate || rawDate.trim().length < 4) {
      return '';
    }

    return rawDate.slice(0, 4);
  }

  public getDisplayReleaseDate(series: TmdbSearchMultiResult): string {
    const rawDate = this.tmdbService.getDisplayDate(series);

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

  public getOverview(series: TmdbSearchMultiResult): string {
    const overview = String(series.overview || '').trim();

    if (overview.length === 0) {
      return 'Ingen beskrivelse endnu.';
    }

    return overview;
  }

  public getOwnAverageRating(seriesId: number): string {
    const summary = this.ratingsMap[seriesId];

    if (!summary || summary.reviewCount <= 0) {
      return 'Ingen ratings endnu';
    }

    return `${summary.averageRating.toFixed(1)}/5`;
  }

  public getOwnReviewCount(seriesId: number): number {
    const summary = this.ratingsMap[seriesId];

    if (!summary) {
      return 0;
    }

    return summary.reviewCount;
  }

  public hasOwnRating(seriesId: number): boolean {
    const summary = this.ratingsMap[seriesId];

    if (!summary) {
      return false;
    }

    return summary.reviewCount > 0;
  }

  public formatOwnRating(value: number): string {
    return Number(value || 0).toFixed(1);
  }

  public trackBySeriesId(index: number, series: TmdbSearchMultiResult): number {
    return series.id;
  }

  public getFeaturedStandardSeries(series: TmdbSearchMultiResult[]): TmdbSearchMultiResult[] {
    return series.slice(0, 3);
  }

  public getRemainingStandardSeries(series: TmdbSearchMultiResult[]): TmdbSearchMultiResult[] {
    return series.slice(3);
  }

  public getFeaturedRatedSeries(series: RatedGenreSeries[]): RatedGenreSeries[] {
    return series.slice(0, 3);
  }

  public getRemainingRatedSeries(series: RatedGenreSeries[]): RatedGenreSeries[] {
    return series.slice(3);
  }

  private loadGenrePage(): void {
    this.genreName = '';
    this.heroSeries = null;
    this.popularSeries = [];
    this.latestSeries = [];
    this.upcomingSeries = [];
    this.customTopRatedSeries = [];
    this.ratingsMap = {};
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    const today = this.getTodayDateString();
    const threeMonthsFromToday = this.getDateStringMonthsFromNow(3);

    const popularRequests = [
      this.tmdbService.discoverTvAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      })
    ];

    const latestRequests = [
      this.tmdbService.discoverTvAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'first_air_date.desc',
        firstAirDateLte: today
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'first_air_date.desc',
        firstAirDateLte: today
      })
    ];

    const upcomingRequests = [
      this.tmdbService.discoverTvAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'first_air_date.asc',
        firstAirDateGte: today,
        firstAirDateLte: threeMonthsFromToday
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'first_air_date.asc',
        firstAirDateGte: today,
        firstAirDateLte: threeMonthsFromToday
      })
    ];

    const ratingCandidateRequests = [
      this.tmdbService.discoverTvAdvanced({
        page: 1,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 2,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 3,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 4,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      }),
      this.tmdbService.discoverTvAdvanced({
        page: 5,
        withGenres: String(this.genreId),
        language: 'en-US',
        sortBy: 'popularity.desc',
        firstAirDateLte: today
      })
    ];

    forkJoin({
      genreResponse: this.tmdbService.getTvGenres(),
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
        genreResponse: BackendTmdbResponse<TmdbTvGenresResponse>;
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

          const popularSeries = this.flattenSeriesResponses(popularResponses).slice(0, 25);
          const latestSeries = this.flattenSeriesResponses(latestResponses).slice(0, 25);
          const upcomingSeries = this.flattenSeriesResponses(upcomingResponses)
            .filter((series: TmdbSearchMultiResult) => this.isUpcomingWithinNextThreeMonths(series))
            .slice(0, 25);
          const ratingCandidates = this.flattenSeriesResponses(ratingCandidateResponses);

          this.popularSeries = popularSeries;
          this.latestSeries = latestSeries;
          this.upcomingSeries = upcomingSeries;
          this.heroSeries = popularSeries.length > 0
            ? popularSeries[0]
            : (latestSeries.length > 0 ? latestSeries[0] : (upcomingSeries.length > 0 ? upcomingSeries[0] : null));

          const allSeriesIds = Array.from(
            new Set(
              [
                ...popularSeries.map((series: TmdbSearchMultiResult) => series.id),
                ...latestSeries.map((series: TmdbSearchMultiResult) => series.id),
                ...upcomingSeries.map((series: TmdbSearchMultiResult) => series.id),
                ...ratingCandidates.map((series: TmdbSearchMultiResult) => series.id)
              ]
            )
          );

          this.ratingsMap = await this.reviewsService.getAverageRatingsForMediaIds(
            'tv',
            allSeriesIds
          );

          const ratedCandidates: RatedGenreSeries[] = ratingCandidates
            .map((series: TmdbSearchMultiResult) => {
              const ratingSummary: MediaRatingSummary | undefined = this.ratingsMap[series.id];

              return {
                ...series,
                ownAverageRating: ratingSummary ? ratingSummary.averageRating : 0,
                ownRatingCount: ratingSummary ? ratingSummary.reviewCount : 0
              };
            })
            .filter((series: RatedGenreSeries) => series.ownRatingCount > 0)
            .sort((a: RatedGenreSeries, b: RatedGenreSeries) => {
              if (b.ownAverageRating !== a.ownAverageRating) {
                return b.ownAverageRating - a.ownAverageRating;
              }

              if (b.ownRatingCount !== a.ownRatingCount) {
                return b.ownRatingCount - a.ownRatingCount;
              }

              return Number(b.popularity || 0) - Number(a.popularity || 0);
            })
            .slice(0, 25);

          this.customTopRatedSeries = ratedCandidates;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        } catch (error) {
          this.customTopRatedSeries = [];
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      },
      error: () => {
        this.finishWithError('Der opstod en fejl under hentning af genre-serier.');
      }
    });
  }

  private flattenSeriesResponses(
    responses: BackendTmdbResponse<TmdbSearchMultiResponse>[]
  ): TmdbSearchMultiResult[] {
    const merged: TmdbSearchMultiResult[] = [];

    for (const response of responses) {
      if (!response || !response.success || !response.data || !Array.isArray(response.data.results)) {
        continue;
      }

      for (const item of response.data.results) {
        if (item.media_type !== 'tv') {
          continue;
        }

        merged.push(item);
      }
    }

    const uniqueMap = new Map<number, TmdbSearchMultiResult>();

    for (const series of merged) {
      if (!uniqueMap.has(series.id)) {
        uniqueMap.set(series.id, series);
      }
    }

    return Array.from(uniqueMap.values());
  }

  private isUpcomingWithinNextThreeMonths(series: TmdbSearchMultiResult): boolean {
    const parsedDate = this.parseSeriesDate(series);

    if (!parsedDate) {
      return false;
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const threeMonthsAhead = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

    return parsedDate >= todayStart && parsedDate <= threeMonthsAhead;
  }

  private parseSeriesDate(series: TmdbSearchMultiResult): Date | null {
    const rawDate = this.tmdbService.getDisplayDate(series);

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