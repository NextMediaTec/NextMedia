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
  DataSnapshot
} from 'firebase/database';

export interface UserProfileData {
  createdAt?: string | null;
  email?: string | null;
  role?: string | null;
  username?: string | null;
  avatarId?: string | null;
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
}