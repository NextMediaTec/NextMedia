import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Unsubscribe } from 'firebase/database';
import { Subscription } from 'rxjs';
import { SearchEngineService, SearchEngineUserResult } from '../services/search-engine.service';
import { TmdbSearchMultiResult, TmdbService } from '../services/tmdb.service';

@Component({
  selector: 'app-search-engine',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './search-engine.html',
  styleUrl: './search-engine.scss'
})
export class SearchEngine implements OnInit, OnDestroy {
  public searchText: string = '';
  public allUsers: SearchEngineUserResult[] = [];
  public filteredUsers: SearchEngineUserResult[] = [];
  public showResults: boolean = false;

  public filteredMedia: TmdbSearchMultiResult[] = [];
  public mediaLoading: boolean = false;

  private usersUnsubscribe: Unsubscribe | null = null;
  private mediaSearchSubscription: Subscription | null = null;

  constructor(
    private searchEngineService: SearchEngineService,
    private tmdbService: TmdbService,
    private router: Router
  ) {}

  public ngOnInit(): void {
    this.usersUnsubscribe = this.searchEngineService.subscribeAllUsers((items: SearchEngineUserResult[]) => {
      this.allUsers = items;
      this.applyFilter();
    });
  }

  public ngOnDestroy(): void {
    if (this.usersUnsubscribe) {
      this.usersUnsubscribe();
      this.usersUnsubscribe = null;
    }

    if (this.mediaSearchSubscription) {
      this.mediaSearchSubscription.unsubscribe();
      this.mediaSearchSubscription = null;
    }
  }

  public onSearchInput(): void {
    this.applyFilter();
  }

  public onSearchFocus(): void {
    this.applyFilter();
  }

  public onSearchBlur(): void {
    setTimeout(() => {
      this.showResults = false;
    }, 150);
  }

  public openUserProfile(user: SearchEngineUserResult): void {
    const safeUid = (user?.uid || '').trim();

    if (safeUid.length === 0) {
      return;
    }

    this.showResults = false;
    this.searchText = user.username;
    this.router.navigate(['/profile', safeUid]);
  }

  public openMedia(item: TmdbSearchMultiResult): void {
    const safeType = String(item.media_type || '').trim();
    const safeId = Number(item.id);

    if (!safeId) {
      return;
    }

    this.showResults = false;
    this.searchText = this.getMediaTitle(item);

    if (safeType === 'person') {
      this.router.navigate(['/show-celeb', safeId]);
      return;
    }

    if (safeType === 'movie' || safeType === 'tv') {
      this.router.navigate(['/show-movie', safeType, safeId]);
    }
  }

  public getMediaTitle(item: TmdbSearchMultiResult): string {
    const movieTitle = String(item.title || item.original_title || '').trim();
    const tvTitle = String(item.name || item.original_name || '').trim();

    if (movieTitle.length > 0) {
      return movieTitle;
    }

    return tvTitle;
  }

  public getMediaDate(item: TmdbSearchMultiResult): string {
    if (String(item.media_type || '').trim() === 'person') {
      return '';
    }

    const movieDate = String(item.release_date || '').trim();
    const tvDate = String(item.first_air_date || '').trim();

    if (movieDate.length > 0) {
      return movieDate;
    }

    return tvDate;
  }

  public getMediaPoster(item: TmdbSearchMultiResult): string {
    const safeType = String(item.media_type || '').trim();

    if (safeType === 'person') {
      return this.tmdbService.getProfileUrl(item.profile_path || null, 'w185');
    }

    return this.tmdbService.getPosterUrl(item.poster_path || null, 'w185');
  }

  public getMediaTypeLabel(mediaType: string): string {
    if (mediaType === 'movie') {
      return 'Film';
    }

    if (mediaType === 'tv') {
      return 'Serie';
    }

    if (mediaType === 'person') {
      return 'Celeb';
    }

    return '';
  }

  private applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();

    if (q.length === 0) {
      this.filteredUsers = [];
      this.filteredMedia = [];
      this.mediaLoading = false;
      this.showResults = false;

      if (this.mediaSearchSubscription) {
        this.mediaSearchSubscription.unsubscribe();
        this.mediaSearchSubscription = null;
      }

      return;
    }

    const matches: SearchEngineUserResult[] = [];

    for (let i = 0; i < this.allUsers.length; i++) {
      const user = this.allUsers[i];
      const username = (user.username || '').toLowerCase();

      if (username.includes(q)) {
        matches.push(user);
      }
    }

    this.filteredUsers = matches.slice(0, 10);

    if (this.mediaSearchSubscription) {
      this.mediaSearchSubscription.unsubscribe();
      this.mediaSearchSubscription = null;
    }

    this.mediaLoading = true;

    this.mediaSearchSubscription = this.tmdbService.searchMulti(this.searchText.trim()).subscribe({
      next: (response) => {
        const items = Array.isArray(response?.data?.results) ? response.data.results : [];
        this.filteredMedia = items.slice(0, 10);
        this.mediaLoading = false;
        this.showResults = this.filteredUsers.length > 0 || this.filteredMedia.length > 0;
      },
      error: () => {
        this.filteredMedia = [];
        this.mediaLoading = false;
        this.showResults = this.filteredUsers.length > 0;
      }
    });
  }
}