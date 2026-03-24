import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Unsubscribe } from 'firebase/database';
import { firstValueFrom } from 'rxjs';

import {
  CustomWatchlistData,
  CustomWatchlistMediaType,
  UserProfileService
} from '../../services/user-profile.service';
import { TmdbGenre, TmdbService } from '../../services/tmdb.service';

interface CreateListGenreOption {
  id: number;
  name: string;
  source: 'movie' | 'tv' | 'both';
  label: string;
}

@Component({
  selector: 'app-user-watchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-watchlist.html',
  styleUrl: './user-watchlist.scss',
})
export class UserWatchlist implements OnChanges, OnDestroy {
  @Input() viewedUid: string = '';

  watchlistMovies: any[] = [];
  watchlistSeries: any[] = [];

  watchlistMovieDetails: any[] = [];
  watchlistSeriesDetails: any[] = [];

  customWatchlists: CustomWatchlistData[] = [];

  movieGenreOptions: CreateListGenreOption[] = [];
  tvGenreOptions: CreateListGenreOption[] = [];
  bothGenreOptions: CreateListGenreOption[] = [];

  isOwner: boolean = false;

  isMoviesExpanded: boolean = true;
  isSeriesExpanded: boolean = true;
  isCustomListsExpanded: boolean = true;
  isCreateListFormVisible: boolean = false;

  createListName: string = '';
  createListMediaType: CustomWatchlistMediaType = 'movie';
  createListGenreValue: string = '';

  selectedMovieIds: number[] = [];
  selectedSeriesIds: number[] = [];

  isRemovingSingleMovie: boolean = false;
  isRemovingSingleSeries: boolean = false;
  isRemovingSelectedMovies: boolean = false;
  isRemovingSelectedSeries: boolean = false;

  isCreatingCustomWatchlist: boolean = false;
  isDeletingCustomWatchlist: boolean = false;

  private unsubWatchlistMovies: Unsubscribe | null = null;
  private unsubWatchlistSeries: Unsubscribe | null = null;
  private unsubCustomWatchlists: Unsubscribe | null = null;

  private movieDetailsLoadVersion: number = 0;
  private seriesDetailsLoadVersion: number = 0;

  constructor(
    private userProfileService: UserProfileService,
    private tmdbService: TmdbService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewedUid']) {
      this.setupRealtimeSubscriptions();
      this.loadGenreOptions();
    }
  }

  ngOnDestroy(): void {
    this.teardownRealtimeSubscriptions();
  }

  toggleMoviesExpanded(): void {
    this.isMoviesExpanded = !this.isMoviesExpanded;
    this.cdr.detectChanges();
  }

  toggleSeriesExpanded(): void {
    this.isSeriesExpanded = !this.isSeriesExpanded;
    this.cdr.detectChanges();
  }

  toggleCustomListsExpanded(): void {
    this.isCustomListsExpanded = !this.isCustomListsExpanded;
    this.cdr.detectChanges();
  }

  toggleCreateListForm(): void {
    this.isCreateListFormVisible = !this.isCreateListFormVisible;
    this.cdr.detectChanges();
  }

  updateCreateListName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.createListName = input.value;
    this.cdr.detectChanges();
  }

  updateCreateListMediaType(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    if (value === 'movie' || value === 'tv' || value === 'both') {
      this.createListMediaType = value;
    } else {
      this.createListMediaType = 'movie';
    }

    this.createListGenreValue = '';
    this.cdr.detectChanges();
  }

  updateCreateListGenreValue(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.createListGenreValue = select.value || '';
    this.cdr.detectChanges();
  }

  getAvailableGenreOptions(): CreateListGenreOption[] {
    if (this.createListMediaType === 'movie') {
      return this.movieGenreOptions;
    }

    if (this.createListMediaType === 'tv') {
      return this.tvGenreOptions;
    }

    return this.bothGenreOptions;
  }

  getGenreOptionValue(option: CreateListGenreOption): string {
    return `${option.source}|${option.id}|${option.name}`;
  }

  getCustomWatchlistMediaTypeLabel(mediaType: CustomWatchlistMediaType): string {
    if (mediaType === 'movie') {
      return 'Movies';
    }

    if (mediaType === 'tv') {
      return 'Series';
    }

    return 'Both';
  }

  isMovieSelected(movieId: number): boolean {
    return this.selectedMovieIds.includes(movieId);
  }

  isSeriesSelected(seriesId: number): boolean {
    return this.selectedSeriesIds.includes(seriesId);
  }

  onMovieSelectionChange(movieId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.selectedMovieIds.includes(movieId)) {
        this.selectedMovieIds = [...this.selectedMovieIds, movieId];
      }
    } else {
      this.selectedMovieIds = this.selectedMovieIds.filter(id => id !== movieId);
    }

    this.cdr.detectChanges();
  }

  onSeriesSelectionChange(seriesId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    if (isChecked) {
      if (!this.selectedSeriesIds.includes(seriesId)) {
        this.selectedSeriesIds = [...this.selectedSeriesIds, seriesId];
      }
    } else {
      this.selectedSeriesIds = this.selectedSeriesIds.filter(id => id !== seriesId);
    }

    this.cdr.detectChanges();
  }

  async createCustomWatchlist(): Promise<void> {
    if (!this.isOwner) {
      return;
    }

    const safeName = (this.createListName || '').trim();

    if (safeName.length === 0) {
      return;
    }

    this.isCreatingCustomWatchlist = true;
    this.cdr.detectChanges();

    try {
      let genreId: number | null = null;
      let genreName: string | null = null;

      if ((this.createListGenreValue || '').trim().length > 0) {
        const parts = this.createListGenreValue.split('|');

        if (parts.length >= 3) {
          const parsedId = Number(parts[1]);
          const parsedName = parts.slice(2).join('|');

          genreId = !Number.isNaN(parsedId) ? parsedId : null;
          genreName = parsedName.trim().length > 0 ? parsedName.trim() : null;
        }
      }

      await this.userProfileService.createMyCustomWatchlist(
        safeName,
        this.createListMediaType,
        genreId,
        genreName
      );

      this.createListName = '';
      this.createListMediaType = 'movie';
      this.createListGenreValue = '';
      this.isCreateListFormVisible = false;
      this.cdr.detectChanges();
    } finally {
      this.isCreatingCustomWatchlist = false;
      this.cdr.detectChanges();
    }
  }

  async deleteCustomWatchlist(listId: string): Promise<void> {
    if (!this.isOwner) {
      return;
    }

    const safeListId = (listId || '').trim();
    if (safeListId.length === 0) {
      return;
    }

    this.isDeletingCustomWatchlist = true;
    this.cdr.detectChanges();

    try {
      await this.userProfileService.deleteMyCustomWatchlist(safeListId);
      this.cdr.detectChanges();
    } finally {
      this.isDeletingCustomWatchlist = false;
      this.cdr.detectChanges();
    }
  }

  async removeMovie(movieId: number): Promise<void> {
    if (!movieId) {
      return;
    }

    this.isRemovingSingleMovie = true;
    this.cdr.detectChanges();

    try {
      await this.userProfileService.removeMovieFromWatchlist(movieId);
      this.selectedMovieIds = this.selectedMovieIds.filter(id => id !== movieId);
      this.cdr.detectChanges();
    } finally {
      this.isRemovingSingleMovie = false;
      this.cdr.detectChanges();
    }
  }

  async removeSeries(seriesId: number): Promise<void> {
    if (!seriesId) {
      return;
    }

    this.isRemovingSingleSeries = true;
    this.cdr.detectChanges();

    try {
      await this.userProfileService.removeSeriesFromWatchlist(seriesId);
      this.selectedSeriesIds = this.selectedSeriesIds.filter(id => id !== seriesId);
      this.cdr.detectChanges();
    } finally {
      this.isRemovingSingleSeries = false;
      this.cdr.detectChanges();
    }
  }

  async removeSelectedMovies(): Promise<void> {
    if (this.selectedMovieIds.length === 0) {
      return;
    }

    this.isRemovingSelectedMovies = true;
    this.cdr.detectChanges();

    try {
      const idsToRemove = [...this.selectedMovieIds];

      for (let i = 0; i < idsToRemove.length; i++) {
        await this.userProfileService.removeMovieFromWatchlist(idsToRemove[i]);
      }

      this.selectedMovieIds = [];
      this.cdr.detectChanges();
    } finally {
      this.isRemovingSelectedMovies = false;
      this.cdr.detectChanges();
    }
  }

  async removeSelectedSeries(): Promise<void> {
    if (this.selectedSeriesIds.length === 0) {
      return;
    }

    this.isRemovingSelectedSeries = true;
    this.cdr.detectChanges();

    try {
      const idsToRemove = [...this.selectedSeriesIds];

      for (let i = 0; i < idsToRemove.length; i++) {
        await this.userProfileService.removeSeriesFromWatchlist(idsToRemove[i]);
      }

      this.selectedSeriesIds = [];
      this.cdr.detectChanges();
    } finally {
      this.isRemovingSelectedSeries = false;
      this.cdr.detectChanges();
    }
  }

  private async loadGenreOptions(): Promise<void> {
    try {
      const movieGenresResponse = await firstValueFrom(this.tmdbService.getMovieGenres());
      const tvGenresResponse = await firstValueFrom(this.tmdbService.getTvGenres());

      const movieGenres: TmdbGenre[] = Array.isArray(movieGenresResponse?.data?.genres)
        ? movieGenresResponse.data.genres
        : [];

      const tvGenres: TmdbGenre[] = Array.isArray(tvGenresResponse?.data?.genres)
        ? tvGenresResponse.data.genres
        : [];

      this.movieGenreOptions = movieGenres.map((genre: TmdbGenre): CreateListGenreOption => {
        return {
          id: genre.id,
          name: genre.name,
          source: 'movie',
          label: genre.name
        };
      });

      this.tvGenreOptions = tvGenres.map((genre: TmdbGenre): CreateListGenreOption => {
        return {
          id: genre.id,
          name: genre.name,
          source: 'tv',
          label: genre.name
        };
      });

      this.bothGenreOptions = [
        ...this.movieGenreOptions.map((genre: CreateListGenreOption): CreateListGenreOption => {
          return {
            id: genre.id,
            name: genre.name,
            source: 'movie',
            label: `${genre.name} (Movie)`
          };
        }),
        ...this.tvGenreOptions.map((genre: CreateListGenreOption): CreateListGenreOption => {
          return {
            id: genre.id,
            name: genre.name,
            source: 'tv',
            label: `${genre.name} (Series)`
          };
        })
      ];

      this.cdr.detectChanges();
    } catch (error) {
      this.movieGenreOptions = [];
      this.tvGenreOptions = [];
      this.bothGenreOptions = [];
      this.cdr.detectChanges();
    }
  }

  private teardownRealtimeSubscriptions(): void {
    if (this.unsubWatchlistMovies) {
      this.unsubWatchlistMovies();
      this.unsubWatchlistMovies = null;
    }

    if (this.unsubWatchlistSeries) {
      this.unsubWatchlistSeries();
      this.unsubWatchlistSeries = null;
    }

    if (this.unsubCustomWatchlists) {
      this.unsubCustomWatchlists();
      this.unsubCustomWatchlists = null;
    }
  }

  private setupRealtimeSubscriptions(): void {
    this.teardownRealtimeSubscriptions();

    const uid = (this.viewedUid || '').trim();

    try {
      const authUser = this.userProfileService.getMyAuthUser();
      this.isOwner = uid.length > 0 && authUser.uid === uid;
    } catch (error) {
      this.isOwner = false;
    }

    if (uid.length === 0) {
      this.watchlistMovies = [];
      this.watchlistSeries = [];
      this.watchlistMovieDetails = [];
      this.watchlistSeriesDetails = [];
      this.customWatchlists = [];
      this.selectedMovieIds = [];
      this.selectedSeriesIds = [];
      this.cdr.detectChanges();
      return;
    }

    this.unsubWatchlistMovies = this.userProfileService.subscribeUserKeyedList(
      `users/${uid}/watchlistMovies`,
      'movieId',
      (items: any[]) => {
        this.ngZone.run(() => {
          this.watchlistMovies = Array.isArray(items) ? items : [];
          this.loadWatchlistMovieDetails();
          this.cdr.detectChanges();
        });
      }
    );

    this.unsubWatchlistSeries = this.userProfileService.subscribeUserKeyedList(
      `users/${uid}/watchlistSeries`,
      'seriesId',
      (items: any[]) => {
        this.ngZone.run(() => {
          this.watchlistSeries = Array.isArray(items) ? items : [];
          this.loadWatchlistSeriesDetails();
          this.cdr.detectChanges();
        });
      }
    );

    this.unsubCustomWatchlists = this.userProfileService.subscribeUserCustomWatchlists(
      uid,
      (items: CustomWatchlistData[]) => {
        this.ngZone.run(() => {
          this.customWatchlists = Array.isArray(items) ? items : [];
          this.cdr.detectChanges();
        });
      }
    );
  }

  private async loadWatchlistMovieDetails(): Promise<void> {
    this.movieDetailsLoadVersion++;
    const currentVersion = this.movieDetailsLoadVersion;

    const rawItems = Array.isArray(this.watchlistMovies) ? [...this.watchlistMovies] : [];

    if (rawItems.length === 0) {
      this.watchlistMovieDetails = [];
      this.selectedMovieIds = [];
      this.cdr.detectChanges();
      return;
    }

    const result: any[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const movieId = Number(item?.movieId);

      if (!movieId) {
        result.push({
          movieId: item?.movieId || '',
          title: 'Unknown',
          posterUrl: '',
          genresText: 'Unknown',
          releaseDate: '—',
          ratingText: '—',
          createdAt: item?.createdAt || '—'
        });
        continue;
      }

      try {
        const response = await firstValueFrom(this.tmdbService.getDetails('movie', movieId));

        if (currentVersion !== this.movieDetailsLoadVersion) {
          return;
        }

        const details = response?.data;

        const genresText = Array.isArray(details?.genres) && details.genres.length > 0
          ? details.genres.map((g: any) => g?.name).filter((x: any) => !!x).join(', ')
          : 'Unknown';

        result.push({
          movieId: movieId,
          title: this.tmdbService.getDisplayTitle(details) || String(movieId),
          posterUrl: this.tmdbService.getPosterUrl(details?.poster_path || null, 'w185'),
          genresText: genresText,
          releaseDate: this.tmdbService.getDisplayDate(details) || '—',
          ratingText: typeof details?.vote_average === 'number' ? details.vote_average.toFixed(1) : '—',
          createdAt: item?.createdAt || '—'
        });
      } catch (error) {
        result.push({
          movieId: movieId,
          title: String(movieId),
          posterUrl: '',
          genresText: 'Unknown',
          releaseDate: '—',
          ratingText: '—',
          createdAt: item?.createdAt || '—'
        });
      }
    }

    if (currentVersion !== this.movieDetailsLoadVersion) {
      return;
    }

    this.watchlistMovieDetails = result;
    this.selectedMovieIds = this.selectedMovieIds.filter(id =>
      this.watchlistMovieDetails.some(item => Number(item?.movieId) === id)
    );
    this.cdr.detectChanges();
  }

  private async loadWatchlistSeriesDetails(): Promise<void> {
    this.seriesDetailsLoadVersion++;
    const currentVersion = this.seriesDetailsLoadVersion;

    const rawItems = Array.isArray(this.watchlistSeries) ? [...this.watchlistSeries] : [];

    if (rawItems.length === 0) {
      this.watchlistSeriesDetails = [];
      this.selectedSeriesIds = [];
      this.cdr.detectChanges();
      return;
    }

    const result: any[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const seriesId = Number(item?.seriesId);

      if (!seriesId) {
        result.push({
          seriesId: item?.seriesId || '',
          title: 'Unknown',
          posterUrl: '',
          genresText: 'Unknown',
          releaseDate: '—',
          ratingText: '—',
          createdAt: item?.createdAt || '—'
        });
        continue;
      }

      try {
        const response = await firstValueFrom(this.tmdbService.getDetails('tv', seriesId));

        if (currentVersion !== this.seriesDetailsLoadVersion) {
          return;
        }

        const details = response?.data;

        const genresText = Array.isArray(details?.genres) && details.genres.length > 0
          ? details.genres.map((g: any) => g?.name).filter((x: any) => !!x).join(', ')
          : 'Unknown';

        result.push({
          seriesId: seriesId,
          title: this.tmdbService.getDisplayTitle(details) || String(seriesId),
          posterUrl: this.tmdbService.getPosterUrl(details?.poster_path || null, 'w185'),
          genresText: genresText,
          releaseDate: this.tmdbService.getDisplayDate(details) || '—',
          ratingText: typeof details?.vote_average === 'number' ? details.vote_average.toFixed(1) : '—',
          createdAt: item?.createdAt || '—'
        });
      } catch (error) {
        result.push({
          seriesId: seriesId,
          title: String(seriesId),
          posterUrl: '',
          genresText: 'Unknown',
          releaseDate: '—',
          ratingText: '—',
          createdAt: item?.createdAt || '—'
        });
      }
    }

    if (currentVersion !== this.seriesDetailsLoadVersion) {
      return;
    }

    this.watchlistSeriesDetails = result;
    this.selectedSeriesIds = this.selectedSeriesIds.filter(id =>
      this.watchlistSeriesDetails.some(item => Number(item?.seriesId) === id)
    );
    this.cdr.detectChanges();
  }

  getWatchlistPosterOrFallback(posterUrl: string): string {
    const safePosterUrl = (posterUrl || '').trim();

    if (safePosterUrl.length > 0) {
      return safePosterUrl;
    }

    return '/assets/Missingposter/missingposter.png';
  }
}