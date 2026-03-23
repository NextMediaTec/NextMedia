import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  TmdbMediaType,
  TmdbMovieOrTvDetails,
  TmdbSearchMultiResult,
  TmdbService
} from '../services/tmdb.service';

type CategoryName = 'drama' | 'romance' | 'comedy' | 'action';

interface DashboardMediaItem {
  id: number;
  mediaType: TmdbMediaType;
  details: TmdbMovieOrTvDetails;
}

interface CategoryConfig {
  name: CategoryName;
  label: string;
  genreId: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public featuredItem: DashboardMediaItem | null = null;
  public errorMessage: string = '';

  public dramaItems: DashboardMediaItem[] = [];
  public romanceItems: DashboardMediaItem[] = [];
  public comedyItems: DashboardMediaItem[] = [];
  public actionItems: DashboardMediaItem[] = [];

  private readonly categories: CategoryConfig[] = [
    { name: 'drama', label: 'Drama', genreId: 18 },
    { name: 'romance', label: 'Romance', genreId: 10749 },
    { name: 'comedy', label: 'Comedy', genreId: 35 },
    { name: 'action', label: 'Action & Adventure', genreId: 10759 }
  ];

  private allFeaturedItems: DashboardMediaItem[] = [];
  private subs: Subscription[] = [];
  private sliderInterval: ReturnType<typeof setInterval> | null = null;
  private featuredIndex: number = 0;

  constructor(
    private tmdbService: TmdbService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.loadFromCache();

    for (const category of this.categories) {
      this.loadCategory(category);
    }
  }

  public ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }

    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
      this.sliderInterval = null;
    }
  }

  private loadCategory(category: CategoryConfig): void {
    const movieRequest = this.tmdbService.discoverByGenre('movie', category.genreId).pipe(
      map((response) => this.filterSearchItems(response?.data?.results || [], 'movie')),
      catchError(() => of([]))
    );

    const tvRequest = this.tmdbService.discoverByGenre('tv', category.genreId).pipe(
      map((response) => this.filterSearchItems(response?.data?.results || [], 'tv')),
      catchError(() => of([]))
    );

    const sub = forkJoin([movieRequest, tvRequest]).subscribe({
      next: ([movies, series]) => {
        const mergedSearchItems = this.mergeSearchItems(movies, series).slice(0, 12);
        this.loadFullDetailsForCategory(category.name, mergedSearchItems);
      },
      error: () => {
        this.errorMessage = 'Data could not be loaded.';
        this.cdr.detectChanges();
      }
    });

    this.subs.push(sub);
  }

  private loadFullDetailsForCategory(
    category: CategoryName,
    searchItems: TmdbSearchMultiResult[]
  ): void {
    if (searchItems.length === 0) {
      this.setCategoryItems(category, []);
      this.buildFeaturedList();
      this.saveToCache();
      this.cdr.detectChanges();
      return;
    }

    const requests = searchItems.map((item) =>
      this.tmdbService.getDetails(item.media_type, item.id).pipe(
        map((response) => {
          return {
            id: item.id,
            mediaType: item.media_type,
            details: response.data
          } as DashboardMediaItem;
        }),
        catchError(() => of(null))
      )
    );

    const sub = forkJoin(requests).subscribe({
      next: (items) => {
        const validItems = items.filter(
          (item): item is DashboardMediaItem =>
            !!item &&
            !!item.details &&
            !!item.details.poster_path &&
            !!item.details.backdrop_path
        );

        this.setCategoryItems(category, validItems);
        this.buildFeaturedList();
        this.saveToCache();
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Data could not be loaded.';
        this.cdr.detectChanges();
      }
    });

    this.subs.push(sub);
  }

  private filterSearchItems(
    items: TmdbSearchMultiResult[],
    mediaType: TmdbMediaType
  ): TmdbSearchMultiResult[] {
    const result: TmdbSearchMultiResult[] = [];

    for (const item of items) {
      const validType = item.media_type === mediaType;
      const hasPoster = !!item.poster_path;
      const hasBackdrop = !!item.backdrop_path;

      if (!validType || !hasPoster || !hasBackdrop) {
        continue;
      }

      const alreadyExists = result.some(
        (x) => x.id === item.id && x.media_type === item.media_type
      );

      if (!alreadyExists) {
        result.push(item);
      }

      if (result.length >= 8) {
        break;
      }
    }

    return result;
  }

  private mergeSearchItems(
    movies: TmdbSearchMultiResult[],
    series: TmdbSearchMultiResult[]
  ): TmdbSearchMultiResult[] {
    const mixed: TmdbSearchMultiResult[] = [];
    const maxLength = Math.max(movies.length, series.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < movies.length) {
        mixed.push(movies[i]);
      }

      if (i < series.length) {
        mixed.push(series[i]);
      }
    }

    return mixed;
  }

  private setCategoryItems(category: CategoryName, items: DashboardMediaItem[]): void {
    if (category === 'drama') {
      this.dramaItems = items;
      return;
    }

    if (category === 'romance') {
      this.romanceItems = items;
      return;
    }

    if (category === 'comedy') {
      this.comedyItems = items;
      return;
    }

    if (category === 'action') {
      this.actionItems = items;
    }
  }

  private buildFeaturedList(): void {
    const mixed = [
      ...this.dramaItems,
      ...this.romanceItems,
      ...this.comedyItems,
      ...this.actionItems
    ];

    const uniqueList: DashboardMediaItem[] = [];

    for (const item of mixed) {
      const exists = uniqueList.some(
        (x) => x.id === item.id && x.mediaType === item.mediaType
      );

      if (!exists) {
        uniqueList.push(item);
      }
    }

    this.allFeaturedItems = uniqueList;

    if (this.allFeaturedItems.length === 0) {
      this.featuredItem = null;
      this.featuredIndex = 0;

      if (this.sliderInterval) {
        clearInterval(this.sliderInterval);
        this.sliderInterval = null;
      }

      return;
    }

    if (!this.featuredItem) {
      this.featuredIndex = 0;
      this.featuredItem = this.allFeaturedItems[0];
      this.startSlider();
      return;
    }

    const currentIndex = this.allFeaturedItems.findIndex(
      (item) =>
        item.id === this.featuredItem?.id &&
        item.mediaType === this.featuredItem?.mediaType
    );

    if (currentIndex >= 0) {
      this.featuredIndex = currentIndex;
      this.featuredItem = this.allFeaturedItems[currentIndex];
    } else {
      this.featuredIndex = 0;
      this.featuredItem = this.allFeaturedItems[0];
    }

    this.startSlider();
  }

  private startSlider(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
      this.sliderInterval = null;
    }

    if (this.allFeaturedItems.length <= 1) {
      return;
    }

    this.sliderInterval = setInterval(() => {
      if (this.allFeaturedItems.length <= 1) {
        return;
      }

      this.featuredIndex = (this.featuredIndex + 1) % this.allFeaturedItems.length;
      this.featuredItem = this.allFeaturedItems[this.featuredIndex];
      this.cdr.detectChanges();
    }, 5000);
  }

  private saveToCache(): void {
    const data = {
      dramaItems: this.dramaItems,
      romanceItems: this.romanceItems,
      comedyItems: this.comedyItems,
      actionItems: this.actionItems
    };

    localStorage.setItem('dashboard_cache', JSON.stringify(data));
  }

  private loadFromCache(): void {
    const raw = localStorage.getItem('dashboard_cache');

    if (!raw) {
      return;
    }

    try {
      const data = JSON.parse(raw);

      this.dramaItems = Array.isArray(data.dramaItems) ? data.dramaItems : [];
      this.romanceItems = Array.isArray(data.romanceItems) ? data.romanceItems : [];
      this.comedyItems = Array.isArray(data.comedyItems) ? data.comedyItems : [];
      this.actionItems = Array.isArray(data.actionItems) ? data.actionItems : [];

      this.buildFeaturedList();
      this.cdr.detectChanges();
    } catch {
      localStorage.removeItem('dashboard_cache');
    }
  }

  public getTitle(item: DashboardMediaItem): string {
    return this.tmdbService.getDisplayTitle(item.details);
  }

  public getDate(item: DashboardMediaItem): string {
    return this.tmdbService.getDisplayDate(item.details);
  }

  public getRating(item: DashboardMediaItem): string {
    if (typeof item.details.vote_average !== 'number') {
      return 'N/A';
    }

    return item.details.vote_average.toFixed(1);
  }

  public getType(item: DashboardMediaItem): string {
    return item.mediaType === 'tv' ? 'TV Series' : 'Movie';
  }

  public getPoster(item: DashboardMediaItem): string {
    return this.tmdbService.getPosterUrl(item.details.poster_path, 'w342');
  }

  public getBackdrop(item: DashboardMediaItem): string {
    return this.tmdbService.getBackdropUrl(item.details.backdrop_path, 'w1280');
  }

  public getGenres(item: DashboardMediaItem): string {
    if (!Array.isArray(item.details.genres) || item.details.genres.length === 0) {
      return '';
    }

    return item.details.genres.map((genre) => genre.name).join(', ');
  }
}