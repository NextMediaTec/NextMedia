import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  BackendTmdbResponse,
  TmdbSearchMultiResponse,
  TmdbSearchMultiResult,
  TmdbService
} from '../../services/tmdb.service';

interface ReleaseMonthItem {
  monthNumber: number;
  monthName: string;
  year: number;
  startDate: string;
  endDate: string;
  posterPath: string | null;
  posterTitle: string;
}

@Component({
  selector: 'app-show-release-calender-months',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './show-release-calender-months.html',
  styleUrl: './show-release-calender-months.scss',
})
export class ShowReleaseCalenderMonths implements OnInit, OnDestroy {
  public currentYear: number = new Date().getFullYear();

  public months: ReleaseMonthItem[] = [];

  public top10Movies: TmdbSearchMultiResult[] = [];

  public readonly fallbackPosterSrc: string = '/assets/Missingposter/missingposter.png';

  private posterSubscriptions: Subscription[] = [];
  private topMoviesSubscription: Subscription | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    public tmdbService: TmdbService
  ) {}

  public ngOnInit(): void {
    this.months = [
      this.createMonth(1, 'January'),
      this.createMonth(2, 'February'),
      this.createMonth(3, 'March'),
      this.createMonth(4, 'April'),
      this.createMonth(5, 'May'),
      this.createMonth(6, 'June'),
      this.createMonth(7, 'July'),
      this.createMonth(8, 'August'),
      this.createMonth(9, 'September'),
      this.createMonth(10, 'October'),
      this.createMonth(11, 'November'),
      this.createMonth(12, 'December')
    ];

    this.cdr.detectChanges();

    this.loadTop10MoviesForYear();

    for (const month of this.months) {
      this.loadRandomPosterForMonth(month);
    }
  }

  public ngOnDestroy(): void {
    for (const subscription of this.posterSubscriptions) {
      subscription.unsubscribe();
    }

    this.posterSubscriptions = [];

    if (this.topMoviesSubscription) {
      this.topMoviesSubscription.unsubscribe();
      this.topMoviesSubscription = null;
    }
  }

  public getMonthPosterSrc(month: ReleaseMonthItem): string {
    if (typeof month.posterPath === 'string' && month.posterPath.trim().length > 0) {
      return this.tmdbService.getPosterUrl(month.posterPath, 'w500');
    }

    return this.fallbackPosterSrc;
  }

  public getMonthPosterAlt(month: ReleaseMonthItem): string {
    if (typeof month.posterTitle === 'string' && month.posterTitle.trim().length > 0) {
      return month.posterTitle;
    }

    return `${month.monthName} missing poster`;
  }

  public getTopMoviePosterSrc(movie: TmdbSearchMultiResult): string {
    if (typeof movie.poster_path === 'string' && movie.poster_path.trim().length > 0) {
      return this.tmdbService.getPosterUrl(movie.poster_path, 'w500');
    }

    return this.fallbackPosterSrc;
  }

  public getTopMoviePosterAlt(movie: TmdbSearchMultiResult): string {
    const title = this.tmdbService.getDisplayTitle(movie);

    if (typeof title === 'string' && title.trim().length > 0) {
      return title;
    }

    return 'Missing movie poster';
  }

  public getTopMovieReleaseDate(movie: TmdbSearchMultiResult): string {
    const releaseDate = String(movie.release_date || '').trim();

    if (releaseDate.length > 0) {
      return releaseDate;
    }

    return 'Release date unavailable';
  }

  private createMonth(monthNumber: number, monthName: string): ReleaseMonthItem {
    const startDate = this.formatDate(this.currentYear, monthNumber, 1);
    const endDate = this.formatDate(this.currentYear, monthNumber, this.getDaysInMonth(this.currentYear, monthNumber));

    return {
      monthNumber,
      monthName,
      year: this.currentYear,
      startDate,
      endDate,
      posterPath: null,
      posterTitle: ''
    };
  }

  private loadTop10MoviesForYear(): void {
    const startDate = this.formatDate(this.currentYear, 1, 1);
    const endDate = this.formatDate(this.currentYear, 12, 31);

    this.topMoviesSubscription = this.tmdbService.discoverMoviesAdvanced({
      page: 1,
      language: 'en-US',
      sortBy: 'popularity.desc',
      releaseDateGte: startDate,
      releaseDateLte: endDate
    }).subscribe({
      next: (response: BackendTmdbResponse<TmdbSearchMultiResponse>) => {
        const responseResults = Array.isArray(response?.data?.results) ? response.data.results : [];

        const validResults = responseResults.filter((item: TmdbSearchMultiResult) => {
          const releaseDate = String(item.release_date || '').trim();

          if (releaseDate.length === 0) {
            return false;
          }

          if (!releaseDate.startsWith(`${this.currentYear}-`)) {
            return false;
          }

          return item.media_type === 'movie';
        });

        this.top10Movies = validResults.slice(0, 10);
        this.cdr.detectChanges();
      },
      error: () => {
        this.top10Movies = [];
        this.cdr.detectChanges();
      }
    });
  }

  private loadRandomPosterForMonth(month: ReleaseMonthItem): void {
    const subscription = this.tmdbService.discoverMoviesAdvanced({
      page: 1,
      language: 'en-US',
      sortBy: 'popularity.desc',
      releaseDateGte: month.startDate,
      releaseDateLte: month.endDate
    }).subscribe({
      next: (response: BackendTmdbResponse<TmdbSearchMultiResponse>) => {
        const responseResults = Array.isArray(response?.data?.results) ? response.data.results : [];

        const validResults = responseResults.filter((item: TmdbSearchMultiResult) => {
          const releaseDate = String(item.release_date || '').trim();

          if (releaseDate.length === 0) {
            return false;
          }

          if (!releaseDate.startsWith(`${month.year}-${String(month.monthNumber).padStart(2, '0')}`)) {
            return false;
          }

          return typeof item.poster_path === 'string' && item.poster_path.trim().length > 0;
        });

        if (validResults.length === 0) {
          month.posterPath = null;
          month.posterTitle = '';
          this.cdr.detectChanges();
          return;
        }

        const randomIndex = Math.floor(Math.random() * validResults.length);
        const randomMovie = validResults[randomIndex];

        month.posterPath = randomMovie.poster_path || null;
        month.posterTitle = this.tmdbService.getDisplayTitle(randomMovie);

        this.cdr.detectChanges();
      },
      error: () => {
        month.posterPath = null;
        month.posterTitle = '';
        this.cdr.detectChanges();
      }
    });

    this.posterSubscriptions.push(subscription);
  }

  private getDaysInMonth(year: number, monthNumber: number): number {
    return new Date(year, monthNumber, 0).getDate();
  }

  private formatDate(year: number, monthNumber: number, day: number): string {
    const month = String(monthNumber).padStart(2, '0');
    const dayValue = String(day).padStart(2, '0');
    return `${year}-${month}-${dayValue}`;
  }

  public trackByMonthNumber(index: number, item: ReleaseMonthItem): number {
    return item.monthNumber;
  }

  public trackByTopMovieId(index: number, item: TmdbSearchMultiResult): number {
    return item.id;
  }
}