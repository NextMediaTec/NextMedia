import { ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CustomWatchlistData,
  CustomWatchlistItemData,
  UserProfileService
} from '../../services/user-profile.service';
import { FirebaseService } from '../../services/firebase.service';
import { TmdbMediaType } from '../../services/tmdb.service';

@Component({
  selector: 'app-watchlist-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist-button.html',
  styleUrl: './watchlist-button.scss'
})
export class WatchlistButtonComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public mediaType: TmdbMediaType = 'movie';
  @Input() public mediaId: number = 0;

  public loading: boolean = false;
  public message: string = '';
  public isError: boolean = false;

  public hasLoadedLists: boolean = false;
  public availableCustomWatchlists: CustomWatchlistData[] = [];
  public selectedCustomWatchlistId: string = '';
  public isInSelectedCustomWatchlist: boolean = false;

  private requestId: number = 0;
  private destroyed: boolean = false;

  constructor(
    private firebaseService: FirebaseService,
    private userProfileService: UserProfileService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  public ngOnInit(): void {
    this.refreshState();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaType'] || changes['mediaId']) {
      this.refreshState();
    }
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
  }

  public updateSelectedCustomWatchlist(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCustomWatchlistId = (select.value || '').trim();
    this.message = '';
    this.isError = false;
    this.refreshSelectedListMembership();
  }

  public async toggleWatchlist(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const currentUser = this.firebaseService.auth.currentUser;

    if (!currentUser) {
      this.zone.run(() => {
        this.message = 'Du skal være logget ind for at bruge custom watchlists.';
        this.isError = true;
        this.cdr.detectChanges();
      });
      return;
    }

    const safeMediaId = Number(this.mediaId || 0);

    if (!safeMediaId) {
      this.zone.run(() => {
        this.message = 'Ugyldigt media-id.';
        this.isError = true;
        this.cdr.detectChanges();
      });
      return;
    }

    const safeListId = (this.selectedCustomWatchlistId || '').trim();

    if (safeListId.length === 0) {
      this.zone.run(() => {
        this.message = 'Vælg en custom watchlist først.';
        this.isError = true;
        this.cdr.detectChanges();
      });
      return;
    }

    const safeItemMediaType = this.mediaType === 'tv' ? 'tv' : 'movie';

    this.zone.run(() => {
      this.loading = true;
      this.message = '';
      this.isError = false;
      this.cdr.detectChanges();
    });

    try {
      if (this.isInSelectedCustomWatchlist) {
        await this.userProfileService.removeItemFromMyCustomWatchlist(
          safeListId,
          safeItemMediaType,
          safeMediaId
        );

        this.zone.run(() => {
          this.isInSelectedCustomWatchlist = false;
          this.message = safeItemMediaType === 'movie'
            ? 'Filmen er fjernet fra den valgte custom watchlist.'
            : 'Serien er fjernet fra den valgte custom watchlist.';
          this.isError = false;
          this.cdr.detectChanges();
        });
      } else {
        await this.userProfileService.addItemToMyCustomWatchlist(
          safeListId,
          safeItemMediaType,
          safeMediaId
        );

        this.zone.run(() => {
          this.isInSelectedCustomWatchlist = true;
          this.message = safeItemMediaType === 'movie'
            ? 'Filmen er tilføjet til den valgte custom watchlist.'
            : 'Serien er tilføjet til den valgte custom watchlist.';
          this.isError = false;
          this.cdr.detectChanges();
        });
      }
    } catch (error: any) {
      this.zone.run(() => {
        this.message = error?.message
          ? String(error.message)
          : 'Der opstod en fejl ved opdatering af custom watchlist.';
        this.isError = true;
        this.cdr.detectChanges();
      });
    } finally {
      this.zone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  private async refreshState(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;
    const currentRequestId = ++this.requestId;

    this.zone.run(() => {
      this.loading = false;
      this.message = '';
      this.isError = false;
      this.hasLoadedLists = false;
      this.availableCustomWatchlists = [];
      this.selectedCustomWatchlistId = '';
      this.isInSelectedCustomWatchlist = false;
      this.cdr.detectChanges();
    });

    if (!currentUser) {
      return;
    }

    const safeMediaId = Number(this.mediaId || 0);

    if (!safeMediaId) {
      return;
    }

    try {
      const allLists = await this.userProfileService.getMyCustomWatchlists();

      if (this.destroyed) {
        return;
      }

      if (currentRequestId !== this.requestId) {
        return;
      }

      const filteredLists = Array.isArray(allLists)
        ? allLists.filter((list: CustomWatchlistData) => {
            if (this.mediaType === 'movie') {
              return list.mediaType === 'movie' || list.mediaType === 'both';
            }

            if (this.mediaType === 'tv') {
              return list.mediaType === 'tv' || list.mediaType === 'both';
            }

            return false;
          })
        : [];

      let nextSelectedListId = '';

      if (filteredLists.length > 0) {
        nextSelectedListId = filteredLists[0].listId;
      }

      this.zone.run(() => {
        this.availableCustomWatchlists = filteredLists;
        this.selectedCustomWatchlistId = nextSelectedListId;
        this.hasLoadedLists = true;
        this.cdr.detectChanges();
      });

      if (nextSelectedListId.length > 0) {
        await this.refreshSelectedListMembership();
      } else {
        this.zone.run(() => {
          this.isInSelectedCustomWatchlist = false;
          this.message = 'Du har ingen custom watchlists der passer til denne type.';
          this.isError = true;
          this.cdr.detectChanges();
        });
      }
    } catch (error: any) {
      if (this.destroyed) {
        return;
      }

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.zone.run(() => {
        this.availableCustomWatchlists = [];
        this.selectedCustomWatchlistId = '';
        this.isInSelectedCustomWatchlist = false;
        this.hasLoadedLists = true;
        this.message = error?.message
          ? String(error.message)
          : 'Der opstod en fejl ved indlæsning af custom watchlists.';
        this.isError = true;
        this.cdr.detectChanges();
      });
    }
  }

  private async refreshSelectedListMembership(): Promise<void> {
    const currentUser = this.firebaseService.auth.currentUser;
    const currentRequestId = ++this.requestId;

    if (!currentUser) {
      this.zone.run(() => {
        this.isInSelectedCustomWatchlist = false;
        this.cdr.detectChanges();
      });
      return;
    }

    const safeMediaId = Number(this.mediaId || 0);
    const safeListId = (this.selectedCustomWatchlistId || '').trim();

    if (!safeMediaId || safeListId.length === 0) {
      this.zone.run(() => {
        this.isInSelectedCustomWatchlist = false;
        this.cdr.detectChanges();
      });
      return;
    }

    try {
      const safeItemMediaType = this.mediaType === 'tv' ? 'tv' : 'movie';
      const items: CustomWatchlistItemData[] = await this.userProfileService.getMyCustomWatchlistItems(
        safeListId,
        safeItemMediaType
      );

      if (this.destroyed) {
        return;
      }

      if (currentRequestId !== this.requestId) {
        return;
      }

      const existsInList = Array.isArray(items)
        ? items.some((item: CustomWatchlistItemData) => Number(item.mediaId) === safeMediaId)
        : false;

      this.zone.run(() => {
        this.isInSelectedCustomWatchlist = existsInList;
        this.cdr.detectChanges();
      });
    } catch (error) {
      if (this.destroyed) {
        return;
      }

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.zone.run(() => {
        this.isInSelectedCustomWatchlist = false;
        this.cdr.detectChanges();
      });
    }
  }
}