import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  BackendTmdbResponse,
  TmdbSearchMultiResponse,
  TmdbSearchMultiResult,
  TmdbService
} from '../../services/tmdb.service';

@Component({
  selector: 'app-release-calender-series',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './release-calender-series.html',
  styleUrl: './release-calender-series.scss',
})
export class ReleaseCalenderSeries implements OnInit, OnDestroy {
  public isLoading: boolean = false;
  public hasError: boolean = false;
  public errorMessage: string = '';
  public selectedYear: number = new Date().getFullYear();
  public selectedMonth: number = new Date().getMonth() + 1;
  public selectedMonthName: string = '';
  public dateFrom: string = '';
  public dateTo: string = '';
  public series: TmdbSearchMultiResult[] = [];

  private routeSubscription: Subscription | null = null;
  private requestSubscriptions: Subscription[] = [];
  private activeLoadId: number = 0;

  constructor(
    private route: ActivatedRoute,
    public tmdbService: TmdbService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const yearParam = Number(params.get('year'));
      const monthParam = Number(params.get('month'));

      const now = new Date();
      const resolvedYear = Number.isInteger(yearParam) && yearParam > 0 ? yearParam : now.getFullYear();
      const resolvedMonth = Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : now.getMonth() + 1;

      this.selectedYear = resolvedYear;
      this.selectedMonth = resolvedMonth;
      this.selectedMonthName = this.getMonthName(this.selectedMonth);
      this.dateFrom = this.formatDate(this.selectedYear, this.selectedMonth, 1);
      this.dateTo = this.formatDate(
        this.selectedYear,
        this.selectedMonth,
        this.getDaysInMonth(this.selectedYear, this.selectedMonth)
      );

      this.cdr.detectChanges();

      this.loadSeriesForMonth(this.selectedYear, this.selectedMonth);
    });
  }

  public ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }

    this.clearRequestSubscriptions();
  }

  public trackBySeriesId(index: number, item: TmdbSearchMultiResult): number {
    return item.id;
  }

  public getSeriesTitle(item: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(item);
  }

  private loadSeriesForMonth(year: number, month: number): void {
    this.activeLoadId += 1;
    const loadId = this.activeLoadId;

    this.clearRequestSubscriptions();

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.series = [];

    this.cdr.detectChanges();

    this.loadSeriesPage(loadId, year, month, 1);
  }

  private loadSeriesPage(
    loadId: number,
    year: number,
    month: number,
    page: number
  ): void {
    const request = this.tmdbService.discoverTvAdvanced({
      page,
      language: 'en-US',
      sortBy: 'popularity.desc',
      firstAirDateGte: this.formatDate(year, month, 1),
      firstAirDateLte: this.formatDate(year, month, this.getDaysInMonth(year, month))
    }).subscribe({
      next: (response: BackendTmdbResponse<TmdbSearchMultiResponse>) => {
        if (loadId !== this.activeLoadId) {
          return;
        }

        const responseResults = Array.isArray(response?.data?.results) ? response.data.results : [];
        const responseTotalPages = Number(response?.data?.total_pages || 1);

        const filteredResults = responseResults.filter((item) => {
          return this.isSeriesInSelectedMonth(item, year, month);
        });

        this.series = this.mergeSeriesByPopularity(this.series, filteredResults);

        if (page === 1) {
          this.isLoading = false;
        }

        this.cdr.detectChanges();

        if (page < responseTotalPages) {
          this.loadSeriesPage(loadId, year, month, page + 1);
          return;
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        if (loadId !== this.activeLoadId) {
          return;
        }

        this.hasError = true;
        this.isLoading = false;
        this.errorMessage = 'Could not load release calendar series.';
        this.cdr.detectChanges();
      }
    });

    this.requestSubscriptions.push(request);
  }

  private mergeSeriesByPopularity(
    existingItems: TmdbSearchMultiResult[],
    newItems: TmdbSearchMultiResult[]
  ): TmdbSearchMultiResult[] {
    const seriesMap = new Map<number, TmdbSearchMultiResult>();

    for (const item of existingItems) {
      seriesMap.set(item.id, item);
    }

    for (const item of newItems) {
      seriesMap.set(item.id, item);
    }

    const output = Array.from(seriesMap.values());

    output.sort((a, b) => {
      const popularityA = typeof a.popularity === 'number' ? a.popularity : 0;
      const popularityB = typeof b.popularity === 'number' ? b.popularity : 0;

      if (popularityA !== popularityB) {
        return popularityB - popularityA;
      }

      const voteCountA = typeof a.vote_count === 'number' ? a.vote_count : 0;
      const voteCountB = typeof b.vote_count === 'number' ? b.vote_count : 0;

      if (voteCountA !== voteCountB) {
        return voteCountB - voteCountA;
      }

      return this.getSeriesTitle(a).localeCompare(this.getSeriesTitle(b));
    });

    return output;
  }

  private isSeriesInSelectedMonth(item: TmdbSearchMultiResult, year: number, month: number): boolean {
    const firstAirDate = String(item.first_air_date || '').trim();

    if (firstAirDate.length === 0) {
      return false;
    }

    const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return firstAirDate.startsWith(targetPrefix);
  }

  private clearRequestSubscriptions(): void {
    for (const request of this.requestSubscriptions) {
      request.unsubscribe();
    }

    this.requestSubscriptions = [];
  }

  private getMonthName(month: number): string {
    const monthNames: string[] = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    return monthNames[month - 1] || '';
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  private formatDate(year: number, month: number, day: number): string {
    const monthValue = String(month).padStart(2, '0');
    const dayValue = String(day).padStart(2, '0');
    return `${year}-${monthValue}-${dayValue}`;
  }
}