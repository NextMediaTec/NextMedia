import { ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';
import { FirebaseService } from '../services/firebase.service';
import { UserProfileService } from '../services/user-profile.service';
import { TmdbMediaType } from '../services/tmdb.service';

@Component({
  selector: 'app-watchlist-button',
  standalone: true,
  imports: [NgIf],
  templateUrl: './watchlist-button.html',
  styleUrl: './watchlist-button.scss'
})
export class WatchlistButtonComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public mediaType: TmdbMediaType = 'movie';
  @Input() public mediaId: number = 0;

  public loading: boolean = false;
  public isInWatchlist: boolean = false;
  public message: string = '';
  public isError: boolean = false;

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

  public async toggleWatchlist(event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const currentUser = this.firebaseService.auth.currentUser;

    if (!currentUser) {
      this.zone.run(() => {
        this.message = 'Du skal være logget ind for at bruge watchlist.';
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

    this.zone.run(() => {
      this.loading = true;
      this.message = '';
      this.isError = false;
      this.cdr.detectChanges();
    });

    try {
      if (this.mediaType === 'movie') {
        if (this.isInWatchlist) {
          await this.userProfileService.removeMovieFromWatchlist(safeMediaId);

          this.zone.run(() => {
            this.isInWatchlist = false;
            this.message = 'Filmen er fjernet fra watchlist.';
            this.isError = false;
            this.cdr.detectChanges();
          });
        } else {
          await this.userProfileService.addMovieToWatchlist(safeMediaId);

          this.zone.run(() => {
            this.isInWatchlist = true;
            this.message = 'Filmen er tilføjet til watchlist.';
            this.isError = false;
            this.cdr.detectChanges();
          });
        }
      } else {
        if (this.isInWatchlist) {
          await this.userProfileService.removeSeriesFromWatchlist(safeMediaId);

          this.zone.run(() => {
            this.isInWatchlist = false;
            this.message = 'Serien er fjernet fra watchlist.';
            this.isError = false;
            this.cdr.detectChanges();
          });
        } else {
          await this.userProfileService.addSeriesToWatchlist(safeMediaId);

          this.zone.run(() => {
            this.isInWatchlist = true;
            this.message = 'Serien er tilføjet til watchlist.';
            this.isError = false;
            this.cdr.detectChanges();
          });
        }
      }
    } catch (error: any) {
      this.zone.run(() => {
        this.message = error?.message ? String(error.message) : 'Der opstod en fejl ved opdatering af watchlist.';
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
      this.isInWatchlist = false;
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
      let inWatchlist = false;

      if (this.mediaType === 'movie') {
        inWatchlist = await this.userProfileService.isMovieInMyWatchlist(safeMediaId);
      } else {
        inWatchlist = await this.userProfileService.isSeriesInMyWatchlist(safeMediaId);
      }

      if (this.destroyed) {
        return;
      }

      if (currentRequestId !== this.requestId) {
        return;
      }

      this.zone.run(() => {
        this.isInWatchlist = inWatchlist;
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
        this.isInWatchlist = false;
        this.cdr.detectChanges();
      });
    }
  }
}