import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../services/firebase.service';
import { ReviewsService, ReviewItem } from '../services/reviews.service';
import { TmdbMediaType } from '../services/tmdb.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss'
})
export class ReviewsComponent implements OnChanges, OnDestroy {
  @Input() public mediaType: TmdbMediaType = 'movie';
  @Input() public mediaId: number = 0;
  @Input() public mediaTitle: string = '';

  public reviews: ReviewItem[] = [];
  public averageRating: number = 0;
  public reviewCount: number = 0;

  public reviewText: string = '';
  public selectedRating: number = 0;
  public submitLoading: boolean = false;
  public message: string = '';
  public isLoggedIn: boolean = false;

  private reviewsSubscription: Subscription | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private reviewsService: ReviewsService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaType'] || changes['mediaId']) {
      this.startReviewsStream();
      this.updateLoginState();
    }
  }

  public ngOnDestroy(): void {
    if (this.reviewsSubscription) {
      this.reviewsSubscription.unsubscribe();
      this.reviewsSubscription = null;
    }
  }

  public setRating(value: number): void {
    this.selectedRating = value;
  }

  public getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  public isStarActive(star: number): boolean {
    return star <= this.selectedRating;
  }

  public formatRating(value: number): string {
    return Number(value || 0).toFixed(1);
  }

  public async submitReview(): Promise<void> {
    this.updateLoginState();

    if (!this.isLoggedIn) {
      this.message = 'Du skal være logget ind for at lave en review.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.mediaId) {
      return;
    }

    this.submitLoading = true;
    this.message = '';
    this.cdr.detectChanges();

    try {
      await this.reviewsService.addOrUpdateReview(
        this.mediaType,
        this.mediaId,
        this.reviewText,
        this.selectedRating
      );

      this.message = 'Din review er gemt.';
      this.reviewText = '';
      this.selectedRating = 0;
    } catch (error: any) {
      this.message = error?.message || 'Der opstod en fejl ved gemning af review.';
    } finally {
      this.submitLoading = false;
      this.cdr.detectChanges();
    }
  }

  private startReviewsStream(): void {
    if (this.reviewsSubscription) {
      this.reviewsSubscription.unsubscribe();
      this.reviewsSubscription = null;
    }

    this.reviews = [];
    this.averageRating = 0;
    this.reviewCount = 0;
    this.message = '';

    if (!this.mediaId) {
      this.cdr.detectChanges();
      return;
    }

    this.reviewsSubscription = this.reviewsService.streamReviews(this.mediaType, this.mediaId).subscribe({
      next: (items) => {
        this.reviews = items;
        this.reviewCount = items.length;

        if (items.length > 0) {
          const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0);
          this.averageRating = total / items.length;
        } else {
          this.averageRating = 0;
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.reviews = [];
        this.averageRating = 0;
        this.reviewCount = 0;
        this.cdr.detectChanges();
      }
    });
  }

  private updateLoginState(): void {
    this.isLoggedIn = !!this.firebaseService.auth.currentUser;
  }
}