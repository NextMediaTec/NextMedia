import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

import {
  updatePassword,
  updateProfile,
  User
} from 'firebase/auth';

import {
  ref,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  DataSnapshot,
  set,
  remove,
  onValue,
  Unsubscribe
} from 'firebase/database';

export interface UserProfileData {
  createdAt?: string | null;
  email?: string | null;
  role?: string | null;
  username?: string | null;
  avatarId?: string | null;
}

export interface FriendRequestWriteResult {
  toUid: string;
  createdAt: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  constructor(private firebase: FirebaseService) {}

  private requireUser(): User {
    const user = this.firebase.auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user. You must be logged in.');
    }
    return user;
  }

  public getMyAuthUser(): User {
    return this.requireUser();
  }

  public async getMyProfile(): Promise<UserProfileData | null> {
    const user = this.requireUser();

    const userRef = ref(this.firebase.db, `users/${user.uid}`);
    const snap: DataSnapshot = await get(userRef);

    if (!snap.exists()) return null;

    const data = snap.val();

    const profile: UserProfileData = {
      createdAt: data?.createdAt ?? null,
      email: data?.email ?? null,
      role: data?.role ?? null,
      username: data?.username ?? null,
      avatarId: data?.avatarId ?? null
    };

    return profile;
  }

  public async getUserProfileByUid(uid: string): Promise<UserProfileData | null> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return null;

    const userRef = ref(this.firebase.db, `users/${safeUid}`);
    const snap: DataSnapshot = await get(userRef);

    if (!snap.exists()) return null;

    const data = snap.val();

    const profile: UserProfileData = {
      createdAt: data?.createdAt ?? null,
      email: data?.email ?? null,
      role: data?.role ?? null,
      username: data?.username ?? null,
      avatarId: data?.avatarId ?? null
    };

    return profile;
  }

  public async changeMyPassword(newPassword: string): Promise<void> {
    const user = this.requireUser();
    await updatePassword(user, newPassword);
  }

  public async isUsernameAvailable(username: string): Promise<boolean> {
    const usersRef = ref(this.firebase.db, 'users');
    const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username));
    const snap: DataSnapshot = await get(usernameQuery);

    return !snap.exists();
  }

  public async changeMyUsername(newUsername: string): Promise<void> {
    const user = this.requireUser();

    const available = await this.isUsernameAvailable(newUsername);
    if (!available) {
      throw new Error('Username is already taken.');
    }

    const userRef = ref(this.firebase.db, `users/${user.uid}`);

    await update(userRef, {
      username: newUsername
    });

    await updateProfile(user, {
      displayName: newUsername
    });
  }

  public async setMyAvatarId(avatarId: string): Promise<void> {
    const user = this.requireUser();

    const userRef = ref(this.firebase.db, `users/${user.uid}`);
    await update(userRef, {
      avatarId: avatarId
    });
  }

  public async ensureMyAvatarIdExists(defaultAvatarId: string): Promise<string> {
    const user = this.requireUser();

    const userRef = ref(this.firebase.db, `users/${user.uid}`);
    const snap: DataSnapshot = await get(userRef);

    if (!snap.exists()) {
      return defaultAvatarId;
    }

    const data = snap.val();
    const currentAvatarId = data?.avatarId ?? null;

    if (currentAvatarId === null || currentAvatarId === undefined) {
      await update(userRef, { avatarId: defaultAvatarId });
      return defaultAvatarId;
    }

    if (typeof currentAvatarId !== 'string') {
      await update(userRef, { avatarId: defaultAvatarId });
      return defaultAvatarId;
    }

    if (currentAvatarId.trim().length === 0) {
      await update(userRef, { avatarId: defaultAvatarId });
      return defaultAvatarId;
    }

    return currentAvatarId;
  }

  public async ensureMyUserSubNodesExist(): Promise<void> {
    const user = this.requireUser();
    const uid = user.uid;

    const userRef = ref(this.firebase.db, `users/${uid}`);
    const snap: DataSnapshot = await get(userRef);

    if (!snap.exists()) {
      await set(userRef, {
        createdAt: new Date().toISOString(),
        email: user.email || null,
        role: 'user',
        username: user.displayName || 'Not set',
        avatarId: null
      });
    }

    await this.ensurePathObjectExists(`users/${uid}/watchlistMovies`);
    await this.ensurePathObjectExists(`users/${uid}/watchlistSeries`);
    await this.ensurePathObjectExists(`users/${uid}/favoriteMovies`);
    await this.ensurePathObjectExists(`users/${uid}/favoriteSeries`);
    await this.ensurePathObjectExists(`users/${uid}/movieReviews`);
    await this.ensurePathObjectExists(`users/${uid}/seriesReviews`);
  }

  private async ensurePathObjectExists(path: string): Promise<void> {
    const r = ref(this.firebase.db, path);
    const snap: DataSnapshot = await get(r);

    if (!snap.exists()) {
      await set(r, {});
      return;
    }

    const v = snap.val();
    if (v === null || v === undefined) {
      await set(r, {});
      return;
    }

    if (typeof v !== 'object') {
      await set(r, {});
      return;
    }
  }

  public async addMovieToWatchlist(movieId: number): Promise<void> {
    const user = this.requireUser();
    const safeMovieId = Number(movieId);

    if (!safeMovieId) {
      throw new Error('Movie id is required.');
    }

    const path = `users/${user.uid}/watchlistMovies/${safeMovieId}`;

    await set(ref(this.firebase.db, path), {
      movieId: safeMovieId,
      createdAt: new Date().toISOString()
    });
  }

  public async removeMovieFromWatchlist(movieId: number): Promise<void> {
    const user = this.requireUser();
    const safeMovieId = Number(movieId);

    if (!safeMovieId) {
      return;
    }

    const path = `users/${user.uid}/watchlistMovies/${safeMovieId}`;
    await remove(ref(this.firebase.db, path));
  }

  public async isMovieInMyWatchlist(movieId: number): Promise<boolean> {
    const user = this.requireUser();
    const safeMovieId = Number(movieId);

    if (!safeMovieId) {
      return false;
    }

    const path = `users/${user.uid}/watchlistMovies/${safeMovieId}`;
    const snap: DataSnapshot = await get(ref(this.firebase.db, path));

    return snap.exists();
  }

  public async addSeriesToWatchlist(seriesId: number): Promise<void> {
    const user = this.requireUser();
    const safeSeriesId = Number(seriesId);

    if (!safeSeriesId) {
      throw new Error('Series id is required.');
    }

    const path = `users/${user.uid}/watchlistSeries/${safeSeriesId}`;

    await set(ref(this.firebase.db, path), {
      seriesId: safeSeriesId,
      createdAt: new Date().toISOString()
    });
  }

  public async removeSeriesFromWatchlist(seriesId: number): Promise<void> {
    const user = this.requireUser();
    const safeSeriesId = Number(seriesId);

    if (!safeSeriesId) {
      return;
    }

    const path = `users/${user.uid}/watchlistSeries/${safeSeriesId}`;
    await remove(ref(this.firebase.db, path));
  }

  public async isSeriesInMyWatchlist(seriesId: number): Promise<boolean> {
    const user = this.requireUser();
    const safeSeriesId = Number(seriesId);

    if (!safeSeriesId) {
      return false;
    }

    const path = `users/${user.uid}/watchlistSeries/${safeSeriesId}`;
    const snap: DataSnapshot = await get(ref(this.firebase.db, path));

    return snap.exists();
  }

  public async getMyWatchlistMovies(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readKeyedListAsArray(`users/${user.uid}/watchlistMovies`, 'movieId');
  }

  public async getMyWatchlistSeries(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readKeyedListAsArray(`users/${user.uid}/watchlistSeries`, 'seriesId');
  }

  public async getMyFavoriteMovies(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readKeyedListAsArray(`users/${user.uid}/favoriteMovies`, 'movieId');
  }

  public async getMyFavoriteSeries(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readKeyedListAsArray(`users/${user.uid}/favoriteSeries`, 'seriesId');
  }

  public async getUserWatchlistMoviesByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readKeyedListAsArray(`users/${safeUid}/watchlistMovies`, 'movieId');
  }

  public async getUserWatchlistSeriesByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readKeyedListAsArray(`users/${safeUid}/watchlistSeries`, 'seriesId');
  }

  public async getUserFavoriteMoviesByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readKeyedListAsArray(`users/${safeUid}/favoriteMovies`, 'movieId');
  }

  public async getUserFavoriteSeriesByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readKeyedListAsArray(`users/${safeUid}/favoriteSeries`, 'seriesId');
  }

  public async getMyFriends(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readFriendsListByUid(user.uid);
  }

  public async getUserFriendsByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readFriendsListByUid(safeUid);
  }

  private async readFriendsListByUid(uid: string): Promise<any[]> {
    const friendsRef = ref(this.firebase.db, `friends/${uid}`);
    const snap: DataSnapshot = await get(friendsRef);

    if (!snap.exists()) return [];

    const data = snap.val();
    if (typeof data !== 'object' || data === null) return [];

    const friendUids = Object.keys(data);
    const results: any[] = [];

    for (let i = 0; i < friendUids.length; i++) {
      const fuid = friendUids[i];
      const friendEntry = data[fuid] || {};

      const friendProfile = await this.getUserProfileByUid(fuid);

      results.push({
        uid: fuid,
        username: friendProfile?.username || fuid,
        email: friendProfile?.email || '',
        avatarId: friendProfile?.avatarId || null,
        isFavorite: friendEntry?.isFavorite === true,
        createdAt: friendEntry?.createdAt || null
      });
    }

    results.sort((a, b) => {
      const af = a?.isFavorite === true ? 1 : 0;
      const bf = b?.isFavorite === true ? 1 : 0;
      if (af !== bf) return bf - af;

      const an = (a?.username || '').toLowerCase();
      const bn = (b?.username || '').toLowerCase();
      if (an < bn) return -1;
      if (an > bn) return 1;
      return 0;
    });

    return results;
  }

  public async removeFriend(friendUid: string): Promise<void> {
    const user = this.requireUser();
    const myUid = user.uid;

    const safeFriendUid = (friendUid || '').trim();
    if (safeFriendUid.length === 0) return;

    await remove(ref(this.firebase.db, `friends/${myUid}/${safeFriendUid}`));
    await remove(ref(this.firebase.db, `friends/${safeFriendUid}/${myUid}`));
  }

  public async setFriendFavorite(friendUid: string, isFavorite: boolean): Promise<void> {
    const user = this.requireUser();
    const myUid = user.uid;

    const safeFriendUid = (friendUid || '').trim();
    if (safeFriendUid.length === 0) return;

    const friendRef = ref(this.firebase.db, `friends/${myUid}/${safeFriendUid}`);
    const snap: DataSnapshot = await get(friendRef);

    if (!snap.exists()) {
      await set(friendRef, {
        isFavorite: isFavorite,
        createdAt: new Date().toISOString()
      });
      return;
    }

    await update(friendRef, {
      isFavorite: isFavorite
    });
  }

  public async sendFriendRequestByUsername(username: string, traceId: string): Promise<FriendRequestWriteResult> {
    const targetUsername = (username || '').trim();
    if (targetUsername.length === 0) {
      throw new Error('Username is required.');
    }

    const usersRef = ref(this.firebase.db, 'users');
    const usernameQuery = query(usersRef, orderByChild('username'), equalTo(targetUsername));

    const snap: DataSnapshot = await get(usernameQuery);

    if (!snap.exists()) {
      throw new Error('No user found with that username.');
    }

    const result = snap.val();
    const keys = Object.keys(result);

    if (keys.length === 0) {
      throw new Error('No user found with that username.');
    }

    const targetUid = keys[0];

    const res = await this.sendFriendRequestToUid(targetUid, traceId);

    return res;
  }

  public async sendFriendRequestToUid(targetUid: string, traceId: string): Promise<FriendRequestWriteResult> {
    const user = this.requireUser();
    const myUid = user.uid;

    const safeTargetUid = (targetUid || '').trim();
    if (safeTargetUid.length === 0) {
      throw new Error('Target uid is required.');
    }

    if (safeTargetUid === myUid) {
      throw new Error('You cannot add yourself.');
    }

    const existingFriendPath = `friends/${myUid}/${safeTargetUid}`;
    const existingFriendSnap: DataSnapshot = await get(ref(this.firebase.db, existingFriendPath));

    if (existingFriendSnap.exists()) {
      throw new Error('You are already friends.');
    }

    const outgoingPath = `friendRequests/outgoing/${myUid}/${safeTargetUid}`;
    const outgoingRef = ref(this.firebase.db, outgoingPath);
    const outgoingSnap: DataSnapshot = await get(outgoingRef);

    if (outgoingSnap.exists()) {
      throw new Error('You have already sent a request to this user.');
    }

    const incomingMinePath = `friendRequests/incoming/${myUid}/${safeTargetUid}`;
    const incomingMineRef = ref(this.firebase.db, incomingMinePath);
    const incomingMineSnap: DataSnapshot = await get(incomingMineRef);

    if (incomingMineSnap.exists()) {
      throw new Error('This user has already sent you a request. Accept it in Friend Requests.');
    }

    const now = new Date().toISOString();
    const status = 'pending';

    const outgoingWritePath = `friendRequests/outgoing/${myUid}/${safeTargetUid}`;
    const incomingWritePath = `friendRequests/incoming/${safeTargetUid}/${myUid}`;

    await set(ref(this.firebase.db, outgoingWritePath), {
      createdAt: now,
      status: status
    });

    await set(ref(this.firebase.db, incomingWritePath), {
      createdAt: now,
      status: status
    });

    const res: FriendRequestWriteResult = { toUid: safeTargetUid, createdAt: now, status: status };

    return res;
  }

  public async cancelMyOutgoingFriendRequest(toUid: string): Promise<void> {
    const user = this.requireUser();
    const myUid = user.uid;

    const safeToUid = (toUid || '').trim();
    if (safeToUid.length === 0) return;
    if (safeToUid === myUid) return;

    await remove(ref(this.firebase.db, `friendRequests/outgoing/${myUid}/${safeToUid}`));
    await remove(ref(this.firebase.db, `friendRequests/incoming/${safeToUid}/${myUid}`));
  }

  public async acceptFriendRequest(fromUid: string): Promise<void> {
    const user = this.requireUser();
    const myUid = user.uid;

    const safeFromUid = (fromUid || '').trim();
    if (safeFromUid.length === 0) return;

    const incomingRef = ref(this.firebase.db, `friendRequests/incoming/${myUid}/${safeFromUid}`);
    const incomingSnap: DataSnapshot = await get(incomingRef);

    if (!incomingSnap.exists()) {
      throw new Error('Request not found.');
    }

    const now = new Date().toISOString();

    await update(ref(this.firebase.db, `friendRequests/incoming/${myUid}/${safeFromUid}`), {
      status: 'accepted'
    });

    await update(ref(this.firebase.db, `friendRequests/outgoing/${safeFromUid}/${myUid}`), {
      status: 'accepted'
    });

    await set(ref(this.firebase.db, `friends/${myUid}/${safeFromUid}`), {
      isFavorite: false,
      createdAt: now
    });

    await set(ref(this.firebase.db, `friends/${safeFromUid}/${myUid}`), {
      isFavorite: false,
      createdAt: now
    });

    await remove(ref(this.firebase.db, `friendRequests/incoming/${myUid}/${safeFromUid}`));
    await remove(ref(this.firebase.db, `friendRequests/outgoing/${safeFromUid}/${myUid}`));
  }

  public async declineFriendRequest(fromUid: string): Promise<void> {
    const user = this.requireUser();
    const myUid = user.uid;

    const safeFromUid = (fromUid || '').trim();
    if (safeFromUid.length === 0) return;

    await update(ref(this.firebase.db, `friendRequests/incoming/${myUid}/${safeFromUid}`), {
      status: 'declined'
    });

    await remove(ref(this.firebase.db, `friendRequests/incoming/${myUid}/${safeFromUid}`));
    await remove(ref(this.firebase.db, `friendRequests/outgoing/${safeFromUid}/${myUid}`));
  }

  public async getMyMovieReviews(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readKeyedListAsArray(`users/${user.uid}/movieReviews`, 'movieId');
  }

  public async getMySeriesReviews(): Promise<any[]> {
    const user = this.requireUser();
    return await this.readKeyedListAsArray(`users/${user.uid}/seriesReviews`, 'seriesId');
  }

  public async getUserMovieReviewsByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readKeyedListAsArray(`users/${safeUid}/movieReviews`, 'movieId');
  }

  public async getUserSeriesReviewsByUid(uid: string): Promise<any[]> {
    const safeUid = (uid || '').trim();
    if (safeUid.length === 0) return [];
    return await this.readKeyedListAsArray(`users/${safeUid}/seriesReviews`, 'seriesId');
  }

  private async readKeyedListAsArray(path: string, idFieldName: string): Promise<any[]> {
    const r = ref(this.firebase.db, path);
    const snap: DataSnapshot = await get(r);

    if (!snap.exists()) return [];

    const data = snap.val();
    if (typeof data !== 'object' || data === null) return [];

    const keys = Object.keys(data);
    const out: any[] = [];

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const v = data[k];

      if (v === true) {
        const o: any = {};
        o[idFieldName] = k;
        out.push(o);
      } else if (typeof v === 'object' && v !== null) {
        const o: any = { ...v };
        if (o[idFieldName] === undefined || o[idFieldName] === null) {
          o[idFieldName] = k;
        }
        out.push(o);
      } else {
        const o: any = {};
        o[idFieldName] = k;
        out.push(o);
      }
    }

    out.sort((a, b) => {
      const at = (a?.createdAt || '');
      const bt = (b?.createdAt || '');
      if (at < bt) return 1;
      if (at > bt) return -1;
      return 0;
    });

    return out;
  }

  public subscribeUserKeyedList(path: string, idFieldName: string, onItems: (items: any[]) => void): Unsubscribe {
    const r = ref(this.firebase.db, path);

    const unsub = onValue(r, (snap: DataSnapshot) => {
      if (!snap.exists()) {
        onItems([]);
        return;
      }

      const data = snap.val();
      if (typeof data !== 'object' || data === null) {
        onItems([]);
        return;
      }

      const keys = Object.keys(data);
      const out: any[] = [];

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = data[k];

        if (v === true) {
          const o: any = {};
          o[idFieldName] = k;
          out.push(o);
        } else if (typeof v === 'object' && v !== null) {
          const o: any = { ...v };
          if (o[idFieldName] === undefined || o[idFieldName] === null) {
            o[idFieldName] = k;
          }
          out.push(o);
        } else {
          const o: any = {};
          o[idFieldName] = k;
          out.push(o);
        }
      }

      out.sort((a, b) => {
        const at = (a?.createdAt || '');
        const bt = (b?.createdAt || '');
        if (at < bt) return 1;
        if (at > bt) return -1;
        return 0;
      });

      onItems(out);
    });

    return unsub;
  }

  public subscribeFriendsList(uid: string, onItems: (items: any[]) => void): Unsubscribe {
    const safeUid = (uid || '').trim();
    const r = ref(this.firebase.db, `friends/${safeUid}`);

    let version = 0;

    const unsub = onValue(r, async (snap: DataSnapshot) => {
      version++;
      const myVersion = version;

      if (!snap.exists()) {
        onItems([]);
        return;
      }

      const data = snap.val();
      if (typeof data !== 'object' || data === null) {
        onItems([]);
        return;
      }

      const friendUids = Object.keys(data);

      const instant: any[] = [];
      for (let i = 0; i < friendUids.length; i++) {
        const fuid = friendUids[i];
        const friendEntry = data[fuid] || {};
        instant.push({
          uid: fuid,
          username: fuid,
          email: '',
          avatarId: null,
          isFavorite: friendEntry?.isFavorite === true,
          createdAt: friendEntry?.createdAt || null
        });
      }

      instant.sort((a, b) => {
        const af = a?.isFavorite === true ? 1 : 0;
        const bf = b?.isFavorite === true ? 1 : 0;
        if (af !== bf) return bf - af;

        const an = (a?.username || '').toLowerCase();
        const bn = (b?.username || '').toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });

      onItems(instant);

      const enriched: any[] = [];
      for (let i = 0; i < friendUids.length; i++) {
        const fuid = friendUids[i];
        const friendEntry = data[fuid] || {};
        const friendProfile = await this.getUserProfileByUid(fuid);

        enriched.push({
          uid: fuid,
          username: friendProfile?.username || fuid,
          email: friendProfile?.email || '',
          avatarId: friendProfile?.avatarId || null,
          isFavorite: friendEntry?.isFavorite === true,
          createdAt: friendEntry?.createdAt || null
        });
      }

      enriched.sort((a, b) => {
        const af = a?.isFavorite === true ? 1 : 0;
        const bf = b?.isFavorite === true ? 1 : 0;
        if (af !== bf) return bf - af;

        const an = (a?.username || '').toLowerCase();
        const bn = (b?.username || '').toLowerCase();
        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });

      if (myVersion !== version) return;
      onItems(enriched);
    });

    return unsub;
  }

  public subscribeIncomingRequests(myUid: string, onItems: (items: any[]) => void): Unsubscribe {
    const safeUid = (myUid || '').trim();
    const r = ref(this.firebase.db, `friendRequests/incoming/${safeUid}`);

    let version = 0;

    const unsub = onValue(r, async (snap: DataSnapshot) => {
      version++;
      const myVersion = version;

      if (!snap.exists()) {
        onItems([]);
        return;
      }

      const data = snap.val();
      if (typeof data !== 'object' || data === null) {
        onItems([]);
        return;
      }

      const fromUids = Object.keys(data);

      const instant: any[] = [];
      for (let i = 0; i < fromUids.length; i++) {
        const fromUid = fromUids[i];
        const entry = data[fromUid] || {};
        instant.push({
          fromUid: fromUid,
          username: fromUid,
          email: '',
          avatarId: null,
          createdAt: entry?.createdAt || null,
          status: entry?.status || null
        });
      }

      instant.sort((a, b) => {
        const at = (a?.createdAt || '');
        const bt = (b?.createdAt || '');
        if (at < bt) return 1;
        if (at > bt) return -1;
        return 0;
      });

      onItems(instant);

      const enriched: any[] = [];
      for (let i = 0; i < fromUids.length; i++) {
        const fromUid = fromUids[i];
        const entry = data[fromUid] || {};
        const profile = await this.getUserProfileByUid(fromUid);

        enriched.push({
          fromUid: fromUid,
          username: profile?.username || fromUid,
          email: profile?.email || '',
          avatarId: profile?.avatarId || null,
          createdAt: entry?.createdAt || null,
          status: entry?.status || null
        });
      }

      enriched.sort((a, b) => {
        const at = (a?.createdAt || '');
        const bt = (b?.createdAt || '');
        if (at < bt) return 1;
        if (at > bt) return -1;
        return 0;
      });

      if (myVersion !== version) return;
      onItems(enriched);
    });

    return unsub;
  }

  public subscribeOutgoingRequests(myUid: string, onItems: (items: any[]) => void): Unsubscribe {
    const safeUid = (myUid || '').trim();
    const path = `friendRequests/outgoing/${safeUid}`;
    const r = ref(this.firebase.db, path);

    let version = 0;

    const unsub = onValue(r, async (snap: DataSnapshot) => {
      version++;
      const myVersion = version;

      if (!snap.exists()) {
        onItems([]);
        return;
      }

      const data = snap.val();
      if (typeof data !== 'object' || data === null) {
        onItems([]);
        return;
      }

      const toUids = Object.keys(data);

      const instant: any[] = [];
      for (let i = 0; i < toUids.length; i++) {
        const toUid = toUids[i];
        const entry = data[toUid] || {};
        instant.push({
          toUid: toUid,
          username: toUid,
          email: '',
          avatarId: null,
          createdAt: entry?.createdAt || null,
          status: entry?.status || null
        });
      }

      instant.sort((a, b) => {
        const at = (a?.createdAt || '');
        const bt = (b?.createdAt || '');
        if (at < bt) return 1;
        if (at > bt) return -1;
        return 0;
      });

      onItems(instant);

      const enriched: any[] = [];
      for (let i = 0; i < toUids.length; i++) {
        const toUid = toUids[i];
        const entry = data[toUid] || {};
        const profile = await this.getUserProfileByUid(toUid);

        enriched.push({
          toUid: toUid,
          username: profile?.username || toUid,
          email: profile?.email || '',
          avatarId: profile?.avatarId || null,
          createdAt: entry?.createdAt || null,
          status: entry?.status || null
        });
      }

      enriched.sort((a, b) => {
        const at = (a?.createdAt || '');
        const bt = (b?.createdAt || '');
        if (at < bt) return 1;
        if (at > bt) return -1;
        return 0;
      });

      if (myVersion !== version) return;
      onItems(enriched);
    });

    return unsub;
  }
}