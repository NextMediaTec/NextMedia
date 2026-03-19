import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { UserProfileService } from '../services/user-profile.service';
import {
  TmdbCastMember,
  TmdbMediaType,
  TmdbMovieOrTvDetails,
  TmdbRecommendationItem,
  TmdbService,
  TmdbVideoItem,
  TmdbImageItem,
  TmdbWatchProviderRegionResult,
  TmdbCertificationDisplayItem,
  TmdbWatchProviderItem
} from '../services/tmdb.service';
import { ReviewsService } from '../services/reviews.service';
import { ReviewsComponent } from '../reviews/reviews';

@Component({
  selector: 'app-show-movie',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, DecimalPipe, ReviewsComponent],
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

  public seenLoading: boolean = false;
  public seenMessage: string = '';
  public isMarkedAsSeen: boolean = false;

  public providersLoading: boolean = false;
  public certificateLoading: boolean = false;

  public allProviderRegions: {
    countryCode: string;
    countryName: string;
    data: TmdbWatchProviderRegionResult;
  }[] = [];

  public certifications: TmdbCertificationDisplayItem[] = [];

  private routeSubscription: Subscription | null = null;
  private detailsSubscription: Subscription | null = null;
  private providersSubscription: Subscription | null = null;
  private certificatesSubscription: Subscription | null = null;
  private watchlistRequestId: number = 0;
  private seenRequestId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private firebaseService: FirebaseService,
    private userProfileService: UserProfileService,
    private reviewsService: ReviewsService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  public ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      this.zone.run(() => {
        const mediaTypeParam = String(params.get('mediaType') || '').trim();
        const idParam = Number(params.get('id'));

        if ((mediaTypeParam !== 'movie' && mediaTypeParam !== 'tv') || !idParam) {
          this.errorMessage = 'Ugyldig film eller serie.';
          this.loading = false;
          this.details = null;
          this.isInWatchlist = false;
          this.isMarkedAsSeen = false;
          this.allProviderRegions = [];
          this.certifications = [];
          this.cdr.detectChanges();
          return;
        }

        this.mediaType = mediaTypeParam;
        this.mediaId = idParam;
        this.watchlistMessage = '';
        this.seenMessage = '';

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

    if (this.providersSubscription) {
      this.providersSubscription.unsubscribe();
      this.providersSubscription = null;
    }

    if (this.certificatesSubscription) {
      this.certificatesSubscription.unsubscribe();
      this.certificatesSubscription = null;
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

  public getImageUrl(path: string | null, size: string = 'w780'): string {
    return this.tmdbService.getImageUrl(path, size);
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

  public getAllCast(): TmdbCastMember[] {
    if (!this.details || !this.details.credits || !Array.isArray(this.details.credits.cast)) {
      return [];
    }

    return this.details.credits.cast;
  }

  public getDirectors(): any[] {
    if (!this.details || !this.details.credits || !Array.isArray(this.details.credits.crew)) {
      return [];
    }

    return this.details.credits.crew.filter((crewMember) => {
      return String(crewMember.job || '').toLowerCase() === 'director';
    });
  }

  public getProducers(): any[] {
    if (!this.details || !this.details.credits || !Array.isArray(this.details.credits.crew)) {
      return [];
    }

    return this.details.credits.crew.filter((crewMember) => {
      return String(crewMember.job || '').toLowerCase().includes('producer');
    });
  }

  public getWriters(): any[] {
    if (!this.details || !this.details.credits || !Array.isArray(this.details.credits.crew)) {
      return [];
    }

    return this.details.credits.crew.filter((crewMember) => {
      const job = String(crewMember.job || '').toLowerCase();
      return job === 'writer' || job === 'screenplay' || job === 'story' || job === 'teleplay';
    });
  }

  public getTrailers(): TmdbVideoItem[] {
    if (!this.details || !this.details.videos || !Array.isArray(this.details.videos.results)) {
      return [];
    }

    return this.details.videos.results.filter((video) => {
      return String(video.site || '').toLowerCase() === 'youtube';
    });
  }

  public getTrailerEmbedUrl(video: TmdbVideoItem) {
    return this.tmdbService.getYoutubeEmbedUrl(video.key);
  }

  public getAllImages(): TmdbImageItem[] {
    if (!this.details || !this.details.images) {
      return [];
    }

    const posters = Array.isArray(this.details.images.posters) ? this.details.images.posters : [];
    const backdrops = Array.isArray(this.details.images.backdrops) ? this.details.images.backdrops : [];

    return [...backdrops, ...posters];
  }

  public getRecommendations(): TmdbRecommendationItem[] {
    if (!this.details || !this.details.recommendations || !Array.isArray(this.details.recommendations.results)) {
      return [];
    }

    return this.details.recommendations.results.slice(0, 18);
  }

  public hasProvidersData(): boolean {
    return this.getAllUniqueStreamingProviders().length > 0;
  }

  public getAllUniqueStreamingProviders(): TmdbWatchProviderItem[] {
    const map = new Map<number, TmdbWatchProviderItem>();

    for (const region of this.allProviderRegions) {
      const flatrate = Array.isArray(region.data.flatrate) ? region.data.flatrate : [];
      const rent = Array.isArray(region.data.rent) ? region.data.rent : [];
      const buy = Array.isArray(region.data.buy) ? region.data.buy : [];
      const free = Array.isArray(region.data.free) ? region.data.free : [];
      const ads = Array.isArray(region.data.ads) ? region.data.ads : [];

      for (const provider of [...flatrate, ...free, ...ads, ...rent, ...buy]) {
        if (!provider || typeof provider.provider_id !== 'number') {
          continue;
        }

        if (!map.has(provider.provider_id)) {
          map.set(provider.provider_id, provider);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const aName = String(a.provider_name || '').toLowerCase();
      const bName = String(b.provider_name || '').toLowerCase();
      return aName.localeCompare(bName);
    });
  }

  public getProviderLogo(path: string | null): string {
    return this.tmdbService.getImageUrl(path, 'w185');
  }

  public getCertificateText(): string {
    if (!Array.isArray(this.certifications) || this.certifications.length === 0) {
      return '';
    }

    return this.certifications
      .map((item) => `${item.countryCode}: ${item.rating}`)
      .join(' • ');
  }

  public isTv(): boolean {
    return this.mediaType === 'tv';
  }

  public scrollGallery(container: HTMLElement, direction: number): void {
    if (!container) {
      return;
    }

    const amount = Math.max(container.clientWidth * 0.85, 320);
    container.scrollBy({
      left: amount * direction,
      behavior: 'smooth'
    });
  }

  public async toggleWatchlist(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;

    if (!currentUser) {
      this.zone.run(() => {
        this.watchlistMessage = 'Du kan ikke tilføje denne film eller serie til watchlist, fordi du ikke er logget ind.';
        this.cdr.detectChanges();
      });
      return;
    }

    if (!this.mediaId) {
      return;
    }

    this.zone.run(() => {
      this.watchlistLoading = true;
      this.watchlistMessage = '';
      this.cdr.detectChanges();
    });

    try {
      const resolvedMediaType = this.getResolvedMediaType();

      if (resolvedMediaType === 'movie') {
        if (this.isInWatchlist) {
          await this.userProfileService.removeMovieFromWatchlist(this.mediaId);

          this.zone.run(() => {
            this.isInWatchlist = false;
            this.watchlistMessage = 'Filmen er fjernet fra watchlist.';
          });
        } else {
          await this.userProfileService.addMovieToWatchlist(this.mediaId);

          this.zone.run(() => {
            this.isInWatchlist = true;
            this.watchlistMessage = 'Filmen er tilføjet til watchlist.';
          });
        }
      } else {
        if (this.isInWatchlist) {
          await this.userProfileService.removeSeriesFromWatchlist(this.mediaId);

          this.zone.run(() => {
            this.isInWatchlist = false;
            this.watchlistMessage = 'Serien er fjernet fra watchlist.';
          });
        } else {
          await this.userProfileService.addSeriesToWatchlist(this.mediaId);

          this.zone.run(() => {
            this.isInWatchlist = true;
            this.watchlistMessage = 'Serien er tilføjet til watchlist.';
          });
        }
      }
    } catch (error: any) {
      this.zone.run(() => {
        this.watchlistMessage = error?.message || 'Der opstod en fejl ved opdatering af watchlist.';
      });
    } finally {
      this.zone.run(() => {
        this.watchlistLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  public async toggleSeen(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;

    if (!currentUser) {
      this.zone.run(() => {
        this.seenMessage = 'Du kan ikke markere som set, fordi du ikke er logget ind.';
        this.cdr.detectChanges();
      });
      return;
    }

    if (!this.mediaId) {
      return;
    }

    this.zone.run(() => {
      this.seenLoading = true;
      this.seenMessage = '';
      this.cdr.detectChanges();
    });

    try {
      if (this.isMarkedAsSeen) {
        await this.reviewsService.unmarkAsSeen(this.getResolvedMediaType(), this.mediaId);

        this.zone.run(() => {
          this.isMarkedAsSeen = false;
          this.seenMessage = 'Titlen er fjernet som set.';
        });
      } else {
        await this.reviewsService.markAsSeen(this.getResolvedMediaType(), this.mediaId);

        this.zone.run(() => {
          this.isMarkedAsSeen = true;
          this.seenMessage = 'Titlen er markeret som set.';
        });
      }
    } catch (error: any) {
      this.zone.run(() => {
        this.seenMessage = error?.message || 'Der opstod en fejl ved opdatering af set-status.';
      });
    } finally {
      this.zone.run(() => {
        this.seenLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  private loadDetails(): void {
    this.zone.run(() => {
      this.loading = true;
      this.errorMessage = '';
      this.details = null;
      this.allProviderRegions = [];
      this.certifications = [];
      this.cdr.detectChanges();
    });

    if (this.detailsSubscription) {
      this.detailsSubscription.unsubscribe();
      this.detailsSubscription = null;
    }

    if (this.providersSubscription) {
      this.providersSubscription.unsubscribe();
      this.providersSubscription = null;
    }

    if (this.certificatesSubscription) {
      this.certificatesSubscription.unsubscribe();
      this.certificatesSubscription = null;
    }

    this.detailsSubscription = this.tmdbService.getDetails(this.mediaType, this.mediaId).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.details = response.data;
          this.loading = false;
          this.cdr.detectChanges();
          this.refreshWatchlistState();
          this.refreshSeenState();
          this.loadProviders();
          this.loadCertificates();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.details = null;
          this.loading = false;
          this.errorMessage = 'Kunne ikke hente information om filmen eller serien.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadProviders(): void {
    this.zone.run(() => {
      this.providersLoading = true;
      this.allProviderRegions = [];
      this.cdr.detectChanges();
    });

    if (this.providersSubscription) {
      this.providersSubscription.unsubscribe();
      this.providersSubscription = null;
    }

    this.providersSubscription = this.tmdbService.getWatchProviders(this.mediaType, this.mediaId).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.allProviderRegions = this.tmdbService.extractWatchProviderRegions(response.data);
          this.providersLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.allProviderRegions = [];
          this.providersLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private loadCertificates(): void {
    this.zone.run(() => {
      this.certificateLoading = true;
      this.certifications = [];
      this.cdr.detectChanges();
    });

    if (this.certificatesSubscription) {
      this.certificatesSubscription.unsubscribe();
      this.certificatesSubscription = null;
    }

    this.certificatesSubscription = this.tmdbService.getCertificates(this.mediaType, this.mediaId).subscribe({
      next: (response) => {
        this.zone.run(() => {
          this.certifications = this.tmdbService.extractCertificationDisplayItems(this.mediaType, response.data);
          this.certificateLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.certifications = [];
          this.certificateLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private async refreshWatchlistState(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;
    const requestId = ++this.watchlistRequestId;

    if (!currentUser || !this.mediaId) {
      this.zone.run(() => {
        this.isInWatchlist = false;
        this.cdr.detectChanges();
      });
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

      this.zone.run(() => {
        this.isInWatchlist = inWatchlist;
        this.cdr.detectChanges();
      });
    } catch {
      if (requestId !== this.watchlistRequestId) {
        return;
      }

      this.zone.run(() => {
        this.isInWatchlist = false;
        this.cdr.detectChanges();
      });
    }
  }

  private async refreshSeenState(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;
    const requestId = ++this.seenRequestId;

    if (!currentUser || !this.mediaId) {
      this.zone.run(() => {
        this.isMarkedAsSeen = false;
        this.cdr.detectChanges();
      });
      return;
    }

    try {
      const isSeen = await this.reviewsService.isMarkedAsSeen(this.getResolvedMediaType(), this.mediaId);

      if (requestId !== this.seenRequestId) {
        return;
      }

      this.zone.run(() => {
        this.isMarkedAsSeen = isSeen;
        this.cdr.detectChanges();
      });
    } catch {
      if (requestId !== this.seenRequestId) {
        return;
      }

      this.zone.run(() => {
        this.isMarkedAsSeen = false;
        this.cdr.detectChanges();
      });
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