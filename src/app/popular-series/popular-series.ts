import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TmdbService, TmdbSearchMultiResult } from '../services/tmdb.service';

@Component({
  selector: 'app-popular-series',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './popular-series.html',
  styleUrl: './popular-series.scss',
})
export class PopularSeries implements OnInit {

  public series: TmdbSearchMultiResult[] = [];
  public isLoading: boolean = true;
  public errorMessage: string = '';
  public currentPage: number = 1;
  public totalPages: number = 1;

  constructor(
    private tmdbService: TmdbService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPopularSeries(1);
  }
  public loadPopularSeries(page: number): void {

    this.isLoading = true
    this.errorMessage = '';

    this.tmdbService.discoverSeriesAdvanced({
      page: page,
      language: 'en-US',
      sortBy: 'popularity.desc',
      voteCountGte: 100
    }).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.series = (response.data.results || []).map((serie) => {
            return {
              ...serie,
              media_type: 'tv'
            };
          });

          this.currentPage = response.data.page || 1;
          this.totalPages = response.data.total_pages || 1;
        }else {
          this.errorMessage = 'Could not load popular series.';
        }

        this.isLoading = false;

        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'An error occurred while loading popular series';
        this.isLoading = false;

        this.cdr.detectChanges();
      }
    });
  }

  public goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.loadPopularSeries(this.currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPopularSeries(this.currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  public getPoster(serie: TmdbSearchMultiResult): string {
    const posterUrl = this.tmdbService.getPosterUrl(serie.poster_path, 'w500');

    if (posterUrl.trim().length > 0) {
      return posterUrl;
    }
    return 'https://via.placeholder.com/300x450?text=No+Image';
  }

  public getTitle(serie: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(serie);
  }

  public getReleaseYear(serie: TmdbSearchMultiResult): string {

    const date = this.tmdbService.getDisplayDate(serie);

    if (!date || date.trim().length < 4) {
      return 'Unknown';
    }
    return date.substring(0, 4);
  }
    public getRating(serie: TmdbSearchMultiResult): string {
      if (typeof serie.vote_average !== 'number') {
        return 'N/A';
      }
      return serie.vote_average.toFixed(1);
    }
    public trackBySeriesId(index: number, serie: TmdbSearchMultiResult): number {
      return serie.id
    }
}