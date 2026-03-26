import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { User, onAuthStateChanged } from 'firebase/auth';

import { FirebaseService } from '../services/firebase.service';
import { UserProfileService } from '../services/user-profile.service';
import { ActivatedRoute } from '@angular/router';
import { Unsubscribe } from 'firebase/database';
import { Subscription } from 'rxjs';
import { UserWatchlist } from '../Watchlist/user-watchlist/user-watchlist';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, UserWatchlist],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfile implements OnInit, OnDestroy {
  user: User | null = null;

  currentUsername: string = 'Not set';
  currentEmail: string = 'Not set';
  currentRole: string = 'Not set';
  currentCreatedAt: string = 'Not set';

  newUsername: string = '';

  newPassword: string = '';
  confirmPassword: string = '';

  isShowProfileSettings: boolean = false;

  defaultAvatarId: string = 'avatar-01';
  currentAvatarId: string = 'avatar-01';

  avatarOptions: { id: string; src: string }[] = [
    { id: 'avatar-01', src: '/assets/avatars/cat.png' },
    { id: 'avatar-02', src: 'assets/avatars/dog.png' },
    { id: 'avatar-03', src: 'assets/avatars/fox.png' },
    { id: 'avatar-04', src: 'assets/avatars/lion.png' },
    { id: 'avatar-05', src: 'assets/avatars/tiger.png' },
    { id: 'avatar-06', src: 'assets/avatars/elefant.png' },
    { id: 'avatar-07', src: 'assets/avatars/monkey.png' },
    { id: 'avatar-08', src: 'assets/avatars/panda.png' },
    { id: 'avatar-09', src: 'assets/avatars/pinguin.png' },
    { id: 'avatar-10', src: 'assets/avatars/rabbit.png' }
  ];

  viewedUid: string = '';
  isOwner: boolean = true;

  isShowWatchlist: boolean = false;
  isShowFavorites: boolean = false;
  isShowFriends: boolean = false;
  isShowFriendRequests: boolean = false;
  isShowMyReviews: boolean = false;

  favoriteMovies: any[] = [];
  favoriteSeries: any[] = [];

  friends: any[] = [];

  incomingFriendRequests: any[] = [];
  outgoingFriendRequests: any[] = [];

  myMovieReviews: any[] = [];
  mySeriesReviews: any[] = [];

  friendSearchText: string = '';
  friendRequestUsername: string = '';

  private unsubFavMovies: Unsubscribe | null = null;
  private unsubFavSeries: Unsubscribe | null = null;
  private unsubMovieReviews: Unsubscribe | null = null;
  private unsubSeriesReviews: Unsubscribe | null = null;
  private unsubFriends: Unsubscribe | null = null;
  private unsubIncoming: Unsubscribe | null = null;
  private unsubOutgoing: Unsubscribe | null = null;

  private authUnsubscribe: (() => void) | null = null;
  private routeParamUnsubscribe: Subscription | null = null;

  actionMessageVisible: boolean = false;
  actionMessageText: string = '';
  actionMessageIsError: boolean = false;

  private actionMessageTimer: any = null;

  private sendCounter: number = 0;

  constructor(
    private firebaseService: FirebaseService,
    private userProfileService: UserProfileService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.optionShowProfileSettings();

    this.authUnsubscribe = onAuthStateChanged(this.firebaseService.auth, (user: User | null) => {
      this.ngZone.run(() => {
        if (!user) {
          this.user = null;
          this.viewedUid = '';
          this.isOwner = false;
          this.teardownRealtimeSubscriptions();
          this.cdr.detectChanges();
          return;
        }

        this.user = user;

        if (this.routeParamUnsubscribe) {
          this.routeParamUnsubscribe.unsubscribe();
          this.routeParamUnsubscribe = null;
        }

        this.routeParamUnsubscribe = this.route.paramMap.subscribe(async params => {
          const routeUid = params.get('uid');
          const queryUid = this.route.snapshot.queryParamMap.get('uid');

          const candidateUid = (routeUid && routeUid.trim().length > 0)
            ? routeUid.trim()
            : ((queryUid && queryUid.trim().length > 0) ? queryUid.trim() : '');

          if (candidateUid.length > 0) {
            this.viewedUid = candidateUid;
          } else {
            this.viewedUid = user.uid;
          }

          this.isOwner = this.viewedUid === user.uid;

          await this.reloadViewedProfile();

          if (this.isOwner) {
            this.optionShowProfileSettings();
          } else {
            this.optionShowWatchlist();
          }

          this.cdr.detectChanges();
        });
      });
    });
  }

  ngOnDestroy(): void {
    this.teardownRealtimeSubscriptions();
    this.dismissActionMessage();

    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }

    if (this.routeParamUnsubscribe) {
      this.routeParamUnsubscribe.unsubscribe();
      this.routeParamUnsubscribe = null;
    }
  }

  private async reloadViewedProfile(): Promise<void> {
    try {
      if (this.isOwner) {
        const profile = await this.userProfileService.getMyProfile();

        this.currentUsername = profile?.username || 'Not set';
        this.currentEmail = profile?.email || 'Not set';
        this.currentRole = profile?.role || 'Not set';
        this.currentCreatedAt = profile?.createdAt || 'Not set';

        const ensuredAvatarId = await this.userProfileService.ensureMyAvatarIdExists(this.defaultAvatarId);

        if (this.isAvatarIdValid(ensuredAvatarId)) {
          this.currentAvatarId = ensuredAvatarId;
        } else {
          this.currentAvatarId = this.defaultAvatarId;
          await this.userProfileService.setMyAvatarId(this.defaultAvatarId);
        }

        try {
          await this.userProfileService.ensureMyUserSubNodesExist();
        } catch (err) {
          this.showActionMessage('Error ensuring user nodes.', true);
        }
      } else {
        const profileOther = await this.userProfileService.getUserProfileByUid(this.viewedUid);

        this.currentUsername = profileOther?.username || 'Not set';
        this.currentEmail = profileOther?.email || 'Not set';
        this.currentRole = profileOther?.role || 'Not set';
        this.currentCreatedAt = profileOther?.createdAt || 'Not set';

        const otherAvatarId = profileOther?.avatarId || this.defaultAvatarId;

        if (this.isAvatarIdValid(otherAvatarId)) {
          this.currentAvatarId = otherAvatarId;
        } else {
          this.currentAvatarId = this.defaultAvatarId;
        }
      }
    } catch (err) {
      this.showActionMessage('Error loading user profile.', true);
    }

    this.setupRealtimeSubscriptions();
    this.cdr.detectChanges();
  }

  private showActionMessage(text: string, isError: boolean): void {
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
      this.actionMessageTimer = null;
    }

    this.actionMessageText = text;
    this.actionMessageIsError = isError;
    this.actionMessageVisible = true;

    this.actionMessageTimer = setTimeout(() => {
      this.actionMessageVisible = false;
      this.actionMessageTimer = null;
      this.cdr.detectChanges();
    }, 3000);

    this.cdr.detectChanges();
  }

  dismissActionMessage(): void {
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
      this.actionMessageTimer = null;
    }
    this.actionMessageVisible = false;
    this.actionMessageText = '';
    this.actionMessageIsError = false;
    this.cdr.detectChanges();
  }

  private teardownRealtimeSubscriptions(): void {
    if (this.unsubFavMovies) { this.unsubFavMovies(); this.unsubFavMovies = null; }
    if (this.unsubFavSeries) { this.unsubFavSeries(); this.unsubFavSeries = null; }
    if (this.unsubMovieReviews) { this.unsubMovieReviews(); this.unsubMovieReviews = null; }
    if (this.unsubSeriesReviews) { this.unsubSeriesReviews(); this.unsubSeriesReviews = null; }
    if (this.unsubFriends) { this.unsubFriends(); this.unsubFriends = null; }
    if (this.unsubIncoming) { this.unsubIncoming(); this.unsubIncoming = null; }
    if (this.unsubOutgoing) { this.unsubOutgoing(); this.unsubOutgoing = null; }
  }

  private setupRealtimeSubscriptions(): void {
    this.teardownRealtimeSubscriptions();

    const uid = (this.viewedUid || '').trim();
    if (uid.length === 0) return;

    this.unsubFavMovies = this.userProfileService.subscribeUserKeyedList(
      `users/${uid}/favoriteMovies`,
      'movieId',
      (items: any[]) => {
        this.ngZone.run(() => {
          this.favoriteMovies = items;
          this.cdr.detectChanges();
        });
      }
    );

    this.unsubFavSeries = this.userProfileService.subscribeUserKeyedList(
      `users/${uid}/favoriteSeries`,
      'seriesId',
      (items: any[]) => {
        this.ngZone.run(() => {
          this.favoriteSeries = items;
          this.cdr.detectChanges();
        });
      }
    );

    this.unsubMovieReviews = this.userProfileService.subscribeUserKeyedList(
      `users/${uid}/movieReviews`,
      'movieId',
      (items: any[]) => {
        this.ngZone.run(() => {
          this.myMovieReviews = items;
          this.cdr.detectChanges();
        });
      }
    );

    this.unsubSeriesReviews = this.userProfileService.subscribeUserKeyedList(
      `users/${uid}/seriesReviews`,
      'seriesId',
      (items: any[]) => {
        this.ngZone.run(() => {
          this.mySeriesReviews = items;
          this.cdr.detectChanges();
        });
      }
    );

    this.unsubFriends = this.userProfileService.subscribeFriendsList(
      uid,
      (items: any[]) => {
        this.ngZone.run(() => {
          this.friends = items;
          this.cdr.detectChanges();
        });
      }
    );

    if (this.isOwner && this.user) {
      const myUid = this.user.uid;

      this.unsubIncoming = this.userProfileService.subscribeIncomingRequests(
        myUid,
        (items: any[]) => {
          this.ngZone.run(() => {
            this.incomingFriendRequests = items;
            this.cdr.detectChanges();
          });
        }
      );

      this.unsubOutgoing = this.userProfileService.subscribeOutgoingRequests(
        myUid,
        (items: any[]) => {
          this.ngZone.run(() => {
            this.outgoingFriendRequests = Array.isArray(items) ? [...items] : [];
            this.cdr.detectChanges();
          });
        }
      );
    } else {
      this.ngZone.run(() => {
        this.incomingFriendRequests = [];
        this.outgoingFriendRequests = [];
        this.cdr.detectChanges();
      });
    }
  }

  private optimisticUpsertOutgoing(toUid: string, createdAt: string, status: string): void {
    const safeToUid = (toUid || '').trim();
    if (safeToUid.length === 0) return;

    const nowCreatedAt = (createdAt || '').trim().length > 0 ? createdAt : new Date().toISOString();
    const nowStatus = (status || '').trim().length > 0 ? status : 'pending';

    const current = Array.isArray(this.outgoingFriendRequests) ? this.outgoingFriendRequests : [];
    const next: any[] = [];

    let found = false;

    for (let i = 0; i < current.length; i++) {
      const r = current[i];
      const rUid = (r?.toUid || '').trim();
      if (rUid === safeToUid) {
        found = true;
        next.push({
          toUid: safeToUid,
          username: r?.username || safeToUid,
          email: r?.email || '',
          avatarId: r?.avatarId || null,
          createdAt: nowCreatedAt,
          status: nowStatus
        });
      } else {
        next.push(r);
      }
    }

    if (!found) {
      next.push({
        toUid: safeToUid,
        username: safeToUid,
        email: '',
        avatarId: null,
        createdAt: nowCreatedAt,
        status: nowStatus
      });
    }

    next.sort((a, b) => {
      const at = (a?.createdAt || '');
      const bt = (b?.createdAt || '');
      if (at < bt) return 1;
      if (at > bt) return -1;
      return 0;
    });

    this.outgoingFriendRequests = [...next];
  }

  optionShowProfileSettings(): void {
    this.isShowProfileSettings = true;

    this.isShowWatchlist = false;
    this.isShowFavorites = false;
    this.isShowFriends = false;
    this.isShowFriendRequests = false;
    this.isShowMyReviews = false;

    this.cdr.detectChanges();
  }

  optionShowWatchlist(): void {
    this.isShowWatchlist = true;
    this.isShowFavorites = false;
    this.isShowFriends = false;
    this.isShowFriendRequests = false;
    this.isShowMyReviews = false;

    this.isShowProfileSettings = false;

    this.cdr.detectChanges();
  }

  optionShowFavorites(): void {
    this.isShowFavorites = true;
    this.isShowWatchlist = false;
    this.isShowFriends = false;
    this.isShowFriendRequests = false;
    this.isShowMyReviews = false;

    this.isShowProfileSettings = false;

    this.cdr.detectChanges();
  }

  optionShowFriends(): void {
    this.isShowFriends = true;
    this.isShowWatchlist = false;
    this.isShowFavorites = false;
    this.isShowFriendRequests = false;
    this.isShowMyReviews = false;

    this.isShowProfileSettings = false;

    this.cdr.detectChanges();
  }

  optionShowMyReviews(): void {
    this.isShowMyReviews = true;
    this.isShowWatchlist = false;
    this.isShowFavorites = false;
    this.isShowFriends = false;
    this.isShowFriendRequests = false;

    this.isShowProfileSettings = false;

    this.cdr.detectChanges();
  }

  updateFriendSearch(event: any): void {
    this.friendSearchText = event.target.value;
  }

  updateFriendRequestUsername(event: any): void {
    this.friendRequestUsername = event.target.value;
  }

  getFilteredFriends(): any[] {
    const t = (this.friendSearchText || '').trim().toLowerCase();
    if (t.length === 0) return this.friends;

    return this.friends.filter(f => {
      const name = (f?.username || '').toLowerCase();
      const email = (f?.email || '').toLowerCase();
      return name.includes(t) || email.includes(t);
    });
  }

  async sendFriendRequest(): Promise<void> {
    const username = (this.friendRequestUsername || '').trim();
    if (username.length === 0) {
      this.showActionMessage('Username is required.', true);
      return;
    }

    this.sendCounter++;
    const traceId = `SEND-${this.sendCounter}-${Date.now()}`;

    try {
      const res = await this.userProfileService.sendFriendRequestByUsername(username, traceId);

      this.ngZone.run(() => {
        this.optimisticUpsertOutgoing(res.toUid, res.createdAt, res.status);
        this.friendRequestUsername = '';
        this.cdr.detectChanges();
      });

      this.showActionMessage('Friend request sent.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error sending friend request.';
      this.showActionMessage(msg, true);
    }
  }

  async cancelOutgoingFriendRequest(toUid: string): Promise<void> {
    try {
      await this.userProfileService.cancelMyOutgoingFriendRequest(toUid);
      this.showActionMessage('Friend request removed.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error removing friend request.';
      this.showActionMessage(msg, true);
    }
  }

  canSendFriendRequestToViewedProfile(): boolean {
    if (!this.user) return false;

    const myUid = this.user.uid;
    const targetUid = (this.viewedUid || '').trim();

    if (targetUid.length === 0) return false;
    if (targetUid === myUid) return false;

    return true;
  }

  async sendFriendRequestToViewedProfile(): Promise<void> {
    if (!this.user) return;

    const myUid = this.user.uid;
    const targetUid = (this.viewedUid || '').trim();

    if (targetUid.length === 0) {
      this.showActionMessage('Invalid target user.', true);
      return;
    }
    if (targetUid === myUid) {
      this.showActionMessage('You cannot add yourself.', true);
      return;
    }

    this.sendCounter++;
    const traceId = `SENDVIEW-${this.sendCounter}-${Date.now()}`;

    try {
      const res = await this.userProfileService.sendFriendRequestToUid(targetUid, traceId);

      this.ngZone.run(() => {
        if (this.isOwner) {
          this.optimisticUpsertOutgoing(res.toUid, res.createdAt, res.status);
        }
        this.cdr.detectChanges();
      });

      this.showActionMessage('Friend request sent.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error sending friend request.';
      this.showActionMessage(msg, true);
    }
  }

  async acceptFriendRequest(fromUid: string): Promise<void> {
    try {
      await this.userProfileService.acceptFriendRequest(fromUid);
      this.showActionMessage('Friend request accepted.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error accepting request.';
      this.showActionMessage(msg, true);
    }
  }

  async declineFriendRequest(fromUid: string): Promise<void> {
    try {
      await this.userProfileService.declineFriendRequest(fromUid);
      this.showActionMessage('Friend request declined.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error declining request.';
      this.showActionMessage(msg, true);
    }
  }

  async removeFriend(friendUid: string): Promise<void> {
    try {
      await this.userProfileService.removeFriend(friendUid);
      this.showActionMessage('Friend removed.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error removing friend.';
      this.showActionMessage(msg, true);
    }
  }

  async toggleFavoriteFriend(friendUid: string, currentIsFavorite: boolean): Promise<void> {
    try {
      await this.userProfileService.setFriendFavorite(friendUid, !currentIsFavorite);
      this.showActionMessage('Favorite updated.', false);
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error updating favorite.';
      this.showActionMessage(msg, true);
    }
  }

  updatePassword(event: any): void {
    this.newPassword = event.target.value;
  }

  updateConfirmPassword(event: any): void {
    this.confirmPassword = event.target.value;
  }

  async submitNewPassword(): Promise<void> {
    if (this.newPassword !== this.confirmPassword) {
      this.showActionMessage('Passwords do not match.', true);
      return;
    }

    try {
      await this.userProfileService.changeMyPassword(this.newPassword);
      this.showActionMessage('Password updated successfully.', false);
      this.newPassword = '';
      this.confirmPassword = '';
      this.cdr.detectChanges();
    } catch (error: any) {
      const msg = error?.message ? error.message : 'Error updating password.';
      this.showActionMessage(msg, true);
    }
  }

  updateUsername(event: any): void {
    this.newUsername = event.target.value;
  }

  async submitNewUsername(): Promise<void> {
    try {
      await this.userProfileService.changeMyUsername(this.newUsername);
      this.showActionMessage('Username updated successfully.', false);
      this.currentUsername = this.newUsername;
      this.newUsername = '';
      this.cdr.detectChanges();
    } catch (error: any) {
      const msg = error?.message ? error.message : 'Error updating username.';
      this.showActionMessage(msg, true);
    }
  }

  async selectAvatar(avatarId: string): Promise<void> {
    const valid = this.isAvatarIdValid(avatarId);
    if (!valid) return;

    this.currentAvatarId = avatarId;

    try {
      await this.userProfileService.setMyAvatarId(avatarId);
      this.showActionMessage('Profile picture updated.', false);
      this.cdr.detectChanges();
    } catch (err: any) {
      const msg = err?.message ? err.message : 'Error updating profile picture.';
      this.showActionMessage(msg, true);
    }
  }

  getAvatarSrcById(avatarId: string): string {
    const found = this.avatarOptions.find(a => a.id === avatarId);
    if (found) return found.src;

    const fallback = this.avatarOptions.find(a => a.id === this.defaultAvatarId);
    if (fallback) return fallback.src;

    return 'assets/avatars/avatar-01.png';
  }

  private isAvatarIdValid(avatarId: string): boolean {
    return this.avatarOptions.some(a => a.id === avatarId);
  }
}