import { Injectable } from '@angular/core';
import { ref, onValue, DataSnapshot, Unsubscribe } from 'firebase/database';
import { FirebaseService } from './firebase.service';

export interface SearchEngineUserResult {
  uid: string;
  username: string;
  email: string;
  avatarId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SearchEngineService {
  constructor(private firebase: FirebaseService) {}

  public subscribeAllUsers(onItems: (items: SearchEngineUserResult[]) => void): Unsubscribe {
    const usersRef = ref(this.firebase.db, 'users');

    const unsub = onValue(usersRef, (snap: DataSnapshot) => {
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
      const out: SearchEngineUserResult[] = [];

      for (let i = 0; i < keys.length; i++) {
        const uid = keys[i];
        const userData = data[uid];

        if (typeof userData !== 'object' || userData === null) {
          continue;
        }

        const usernameValue = typeof userData.username === 'string' ? userData.username.trim() : '';
        const emailValue = typeof userData.email === 'string' ? userData.email : '';
        const avatarIdValue = typeof userData.avatarId === 'string' ? userData.avatarId : null;

        if (usernameValue.length === 0) {
          continue;
        }

        out.push({
          uid: uid,
          username: usernameValue,
          email: emailValue,
          avatarId: avatarIdValue
        });
      }

      out.sort((a, b) => {
        const an = a.username.toLowerCase();
        const bn = b.username.toLowerCase();

        if (an < bn) return -1;
        if (an > bn) return 1;
        return 0;
      });

      onItems(out);
    });

    return unsub;
  }
}