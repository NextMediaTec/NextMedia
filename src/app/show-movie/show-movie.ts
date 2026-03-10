import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { UserProfileService } from '../services/user-profile.service';
import { TmdbMediaType, TmdbMovieOrTvDetails, TmdbRecommendationItem, TmdbService } from '../services/tmdb.service';

@Component({
  selector: 'app-show-movie',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DecimalPipe],
  templateUrl: './show-movie.html',
  styleUrl: './show-movie.scss'
})
export class ShowMovieComponent implements OnInit, OnDestroy {
  public loading: boolean = false;
  public errorMessage: string = '';
  public mediaType: TmdbMediaType = 'movie';
  public mediaId: number = 0;
  public details: TmdbMovieOrTvDetails | null = null;

  public watchlistLoading: boolean = false;
  public isInWatchlist: boolean = false;
  public watchlistMessage: string = '';

  private routeSubscription: Subscription | null = null;
  private detailsSubscription: Subscription | null = null;
  private watchlistRequestId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private firebaseService: FirebaseService,
    private userProfileService: UserProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const mediaTypeParam = String(params.get('mediaType') || '').trim();
      const idParam = Number(params.get('id'));

      if ((mediaTypeParam !== 'movie' && mediaTypeParam !== 'tv') || !idParam) {
        this.errorMessage = 'Ugyldig film eller serie.';
        this.loading = false;
        this.details = null;
        this.isInWatchlist = false;
        this.cdr.detectChanges();
        return;
      }

      this.mediaType = mediaTypeParam;
      this.mediaId = idParam;
      this.watchlistMessage = '';

      Promise.resolve().then(() => {
        this.loadDetails();
      });
    });
  }

  public ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
      this.routeSubscription = null;
    }

    if (this.detailsSubscription) {
      this.detailsSubscription.unsubscribe();
      this.detailsSubscription = null;
    }
  }

  public getTitle(): string {
    if (!this.details) {
      return '';
    }

    return this.tmdbService.getDisplayTitle(this.details);
  }

  public getDate(): string {
    if (!this.details) {
      return '';
    }

    return this.tmdbService.getDisplayDate(this.details);
  }

  public getPosterUrl(): string {
    if (!this.details) {
      return '';
    }

    return this.tmdbService.getPosterUrl(this.details.poster_path, 'w500');
  }

  public getBackdropUrl(): string {
    if (!this.details) {
      return '';
    }

    return this.tmdbService.getBackdropUrl(this.details.backdrop_path, 'w1280');
  }

  public getCastProfile(path: string | null): string {
    return this.tmdbService.getProfileUrl(path, 'w185');
  }

  public getRecommendationPoster(path: string | null): string {
    return this.tmdbService.getPosterUrl(path, 'w342');
  }

  public getRecommendationTitle(item: TmdbRecommendationItem): string {
    const movieTitle = item.title || item.original_title || '';
    const tvTitle = item.name || item.original_name || '';

    if (movieTitle.trim().length > 0) {
      return movieTitle;
    }

    return tvTitle;
  }

  public getRecommendationDate(item: TmdbRecommendationItem): string {
    const movieDate = item.release_date || '';
    const tvDate = item.first_air_date || '';

    if (movieDate.trim().length > 0) {
      return movieDate;
    }

    return tvDate;
  }

  public getRuntimeText(): string {
    if (!this.details) {
      return '';
    }

    if (typeof this.details.runtime === 'number' && this.details.runtime > 0) {
      const hours = Math.floor(this.details.runtime / 60);
      const minutes = this.details.runtime % 60;

      if (hours > 0) {
        return `${hours}t ${minutes}m`;
      }

      return `${minutes}m`;
    }

    if (Array.isArray(this.details.episode_run_time) && this.details.episode_run_time.length > 0) {
      return `${this.details.episode_run_time[0]}m pr. episode`;
    }

    return '';
  }

  public getGenresText(): string {
    if (!this.details || !Array.isArray(this.details.genres) || this.details.genres.length === 0) {
      return '';
    }

    return this.details.genres.map((genre) => genre.name).join(', ');
  }

  public getTopCast(): any[] {
    if (!this.details || !this.details.credits || !Array.isArray(this.details.credits.cast)) {
      return [];
    }

    return this.details.credits.cast.slice(0, 12);
  }

  public getRecommendations(): TmdbRecommendationItem[] {
    if (!this.details || !this.details.recommendations || !Array.isArray(this.details.recommendations.results)) {
      return [];
    }

    return this.details.recommendations.results.slice(0, 12);
  }

  public async toggleWatchlist(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;

    if (!currentUser) {
      this.watchlistMessage = 'Du kan ikke tilføje denne film eller serie til watchlist, fordi du ikke er logget ind.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.mediaId) {
      return;
    }

    this.watchlistLoading = true;
    this.watchlistMessage = '';
    this.cdr.detectChanges();

    try {
      const resolvedMediaType = this.getResolvedMediaType();

      if (resolvedMediaType === 'movie') {
        if (this.isInWatchlist) {
          await this.userProfileService.removeMovieFromWatchlist(this.mediaId);
          this.isInWatchlist = false;
          this.watchlistMessage = 'Filmen er fjernet fra watchlist.';
        } else {
          await this.userProfileService.addMovieToWatchlist(this.mediaId);
          this.isInWatchlist = true;
          this.watchlistMessage = 'Filmen er tilføjet til watchlist.';
        }
      } else {
        if (this.isInWatchlist) {
          await this.userProfileService.removeSeriesFromWatchlist(this.mediaId);
          this.isInWatchlist = false;
          this.watchlistMessage = 'Serien er fjernet fra watchlist.';
        } else {
          await this.userProfileService.addSeriesToWatchlist(this.mediaId);
          this.isInWatchlist = true;
          this.watchlistMessage = 'Serien er tilføjet til watchlist.';
        }
      }
    } catch (error: any) {
      this.watchlistMessage = error?.message || 'Der opstod en fejl ved opdatering af watchlist.';
    } finally {
      this.watchlistLoading = false;
      this.cdr.detectChanges();
    }
  }

  private loadDetails(): void {
    this.loading = true;
    this.errorMessage = '';
    this.details = null;
    this.cdr.detectChanges();

    if (this.detailsSubscription) {
      this.detailsSubscription.unsubscribe();
      this.detailsSubscription = null;
    }

    this.detailsSubscription = this.tmdbService.getDetails(this.mediaType, this.mediaId).subscribe({
      next: (response) => {
        this.details = response.data;
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshWatchlistState();
      },
      error: () => {
        this.details = null;
        this.loading = false;
        this.errorMessage = 'Kunne ikke hente information om filmen eller serien.';
        this.cdr.detectChanges();
      }
    });
  }

  private async refreshWatchlistState(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;
    const requestId = ++this.watchlistRequestId;

    if (!currentUser || !this.mediaId) {
      this.isInWatchlist = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      let inWatchlist = false;
      const resolvedMediaType = this.getResolvedMediaType();

      if (resolvedMediaType === 'movie') {
        inWatchlist = await this.userProfileService.isMovieInMyWatchlist(this.mediaId);
      } else {
        inWatchlist = await this.userProfileService.isSeriesInMyWatchlist(this.mediaId);
      }

      if (requestId !== this.watchlistRequestId) {
        return;
      }

      this.isInWatchlist = inWatchlist;
      this.cdr.detectChanges();
    } catch {
      if (requestId !== this.watchlistRequestId) {
        return;
      }

      this.isInWatchlist = false;
      this.cdr.detectChanges();
    }
  }

  private getResolvedMediaType(): TmdbMediaType {
    if (this.details) {
      const hasMovieFields =
        typeof this.details.title === 'string' && this.details.title.trim().length > 0 ||
        typeof this.details.release_date === 'string' && this.details.release_date.trim().length > 0 ||
        typeof this.details.runtime === 'number';

      const hasTvFields =
        typeof this.details.name === 'string' && this.details.name.trim().length > 0 ||
        typeof this.details.first_air_date === 'string' && this.details.first_air_date.trim().length > 0 ||
        Array.isArray(this.details.episode_run_time) ||
        typeof this.details.number_of_seasons === 'number';

      if (hasMovieFields && !hasTvFields) {
        return 'movie';
      }

      if (hasTvFields && !hasMovieFields) {
        return 'tv';
      }
    }

    return this.mediaType;
  }
}