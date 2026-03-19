import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DataSnapshot,
  get,
  onValue,
  ref,
  remove,
  set
} from 'firebase/database';
import { FirebaseService } from './firebase.service';
import { TmdbMediaType } from './tmdb.service';

export interface ReviewItem {
  mediaId: number;
  mediaType: TmdbMediaType;
  reviewText: string;
  username: string;
  userId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  constructor(private firebase: FirebaseService) {}

  public async markAsSeen(mediaType: TmdbMediaType, mediaId: number): Promise<void> {
    const currentUser = this.firebase.auth.currentUser;

    if (!currentUser) {
      throw new Error('Du skal være logget ind for at markere som set.');
    }

    const seenRef = ref(this.firebase.db, `seenMedia/${currentUser.uid}/${mediaType}/${mediaId}`);

    await set(seenRef, {
      mediaId,
      mediaType,
      seen: true,
      updatedAt: new Date().toISOString()
    });
  }

  public async unmarkAsSeen(mediaType: TmdbMediaType, mediaId: number): Promise<void> {
    const currentUser = this.firebase.auth.currentUser;

    if (!currentUser) {
      throw new Error('Du skal være logget ind for at ændre set-status.');
    }

    const seenRef = ref(this.firebase.db, `seenMedia/${currentUser.uid}/${mediaType}/${mediaId}`);
    await remove(seenRef);
  }

  public async isMarkedAsSeen(mediaType: TmdbMediaType, mediaId: number): Promise<boolean> {
    const currentUser = this.firebase.auth.currentUser;

    if (!currentUser) {
      return false;
    }

    const seenRef = ref(this.firebase.db, `seenMedia/${currentUser.uid}/${mediaType}/${mediaId}`);
    const snapshot = await get(seenRef);

    return snapshot.exists();
  }

  public streamReviews(mediaType: TmdbMediaType, mediaId: number): Observable<ReviewItem[]> {
    return new Observable<ReviewItem[]>((subscriber) => {
      const reviewsRef = ref(this.firebase.db, `mediaReviews/${mediaType}/${mediaId}`);

      const unsubscribe = onValue(
        reviewsRef,
        (snapshot: DataSnapshot) => {
          const raw = snapshot.val();
          const reviews: ReviewItem[] = [];

          if (raw && typeof raw === 'object') {
            for (const key of Object.keys(raw)) {
              const value = raw[key];

              if (!value) {
                continue;
              }

              reviews.push({
                mediaId: Number(value.mediaId || mediaId),
                mediaType: (value.mediaType || mediaType) as TmdbMediaType,
                reviewText: String(value.reviewText || ''),
                username: String(value.username || 'Ukendt bruger'),
                userId: String(value.userId || key),
                rating: Number(value.rating || 0),
                createdAt: String(value.createdAt || ''),
                updatedAt: String(value.updatedAt || '')
              });
            }
          }

          reviews.sort((a, b) => {
            return String(b.updatedAt).localeCompare(String(a.updatedAt));
          });

          subscriber.next(reviews);
        },
        (error) => {
          subscriber.error(error);
        }
      );

      return () => {
        unsubscribe();
      };
    });
  }

  public async addOrUpdateReview(
    mediaType: TmdbMediaType,
    mediaId: number,
    reviewText: string,
    rating: number
  ): Promise<void> {
    const currentUser = this.firebase.auth.currentUser;

    if (!currentUser) {
      throw new Error('Du skal være logget ind for at lave en review.');
    }

    const trimmedText = String(reviewText || '').trim();
    const clampedRating = Math.max(0, Math.min(5, Number(rating || 0)));

    const username = await this.getUsernameForCurrentUser();
    const reviewRef = ref(this.firebase.db, `mediaReviews/${mediaType}/${mediaId}/${currentUser.uid}`);
    const existingSnapshot = await get(reviewRef);
    const existingCreatedAt = existingSnapshot.exists()
      ? String(existingSnapshot.val()?.createdAt || '')
      : '';

    await set(reviewRef, {
      mediaId,
      mediaType,
      reviewText: trimmedText,
      username,
      userId: currentUser.uid,
      rating: clampedRating,
      createdAt: existingCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  private async getUsernameForCurrentUser(): Promise<string> {
    const currentUser = this.firebase.auth.currentUser;

    if (!currentUser) {
      return 'Ukendt bruger';
    }

    const userRef = ref(this.firebase.db, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const value = snapshot.val();
      const username = String(value?.username || '').trim();

      if (username.length > 0) {
        return username;
      }
    }

    if (typeof currentUser.displayName === 'string' && currentUser.displayName.trim().length > 0) {
      return currentUser.displayName.trim();
    }

    if (typeof currentUser.email === 'string' && currentUser.email.includes('@')) {
      return currentUser.email.split('@')[0];
    }

    return 'Ukendt bruger';
  }
}