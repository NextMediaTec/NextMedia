import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Unsubscribe } from 'firebase/database';
import { Subscription } from 'rxjs';
import { SearchEngineService, SearchEngineUserResult } from '../services/search-engine.service';
import { TmdbMediaType, TmdbSearchMultiResult, TmdbService } from '../services/tmdb.service';

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
    const safeType = item.media_type;
    const safeId = Number(item.id);

    if ((safeType !== 'movie' && safeType !== 'tv') || !safeId) {
      return;
    }

    this.showResults = false;
    this.searchText = this.getMediaTitle(item);
    this.router.navigate(['/show-movie', safeType, safeId]);
  }

  public getMediaTitle(item: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayTitle(item);
  }

  public getMediaDate(item: TmdbSearchMultiResult): string {
    return this.tmdbService.getDisplayDate(item);
  }

  public getMediaPoster(path: string | null): string {
    return this.tmdbService.getPosterUrl(path, 'w185');
  }

  public getMediaTypeLabel(mediaType: TmdbMediaType): string {
    if (mediaType === 'movie') {
      return 'Film';
    }

    return 'Serie';
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