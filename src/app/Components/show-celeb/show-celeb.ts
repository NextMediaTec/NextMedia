import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  TmdbPersonCreditListItem,
  TmdbPersonDetails,
  TmdbPersonPageResponse,
  TmdbService
} from '../../services/tmdb.service';

@Component({
  selector: 'app-show-celeb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './show-celeb.html',
  styleUrl: './show-celeb.scss'
})
export class ShowCeleb implements OnInit, OnDestroy {
  public isLoading: boolean = true;
  public hasError: boolean = false;
  public errorMessage: string = '';
  public person: TmdbPersonDetails | null = null;
  public combinedCredits: TmdbPersonCreditListItem[] = [];
  public mostPopularMovies: TmdbPersonCreditListItem[] = [];
  public boxOfficeTotal: number | null = null;

  private routeSubscription: Subscription | null = null;
  private personSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    public tmdbService: TmdbService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const rawId = String(params.get('id') || '').trim();
      const id = Number(rawId);

      if (!rawId || Number.isNaN(id) || id <= 0) {
        this.hasError = true;
        this.isLoading = false;
        this.errorMessage = 'Ugyldigt person-id.';
        this.changeDetectorRef.detectChanges();
        return;
      }

      this.loadPerson(id);
    });
  }

  public ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
      this.routeSubscription = null;
    }

    if (this.personSubscription) {
      this.personSubscription.unsubscribe();
      this.personSubscription = null;
    }
  }

  public loadPerson(id: number): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.person = null;
    this.combinedCredits = [];
    this.mostPopularMovies = [];
    this.boxOfficeTotal = null;
    this.changeDetectorRef.detectChanges();

    if (this.personSubscription) {
      this.personSubscription.unsubscribe();
      this.personSubscription = null;
    }

    this.personSubscription = this.tmdbService.getPersonDetails(id).subscribe({
      next: (response) => {
        const data: TmdbPersonPageResponse | null = response?.data || null;

        if (!data || !data.person) {
          this.hasError = true;
          this.errorMessage = 'Kunne ikke hente persondata.';
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
          return;
        }

        this.person = data.person;
        this.combinedCredits = Array.isArray(data.combinedCredits) ? data.combinedCredits : [];
        this.mostPopularMovies = Array.isArray(data.mostPopularMovies) ? data.mostPopularMovies : [];
        this.boxOfficeTotal = typeof data.boxOfficeTotal === 'number' ? data.boxOfficeTotal : null;
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.hasError = true;
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          'Der opstod en fejl under hentning af persondata.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  public getPersonName(): string {
    if (!this.person) {
      return '';
    }

    return String(this.person.name || '').trim();
  }

  public getBiography(): string {
    if (!this.person) {
      return '';
    }

    return String(this.person.biography || '').trim();
  }

  public hasBiography(): boolean {
    return this.getBiography().length > 0;
  }

  public getKnownDepartment(): string {
    if (!this.person) {
      return '';
    }

    return String(this.person.known_for_department || '').trim();
  }

  public getBirthday(): string {
    if (!this.person) {
      return '';
    }

    return String(this.person.birthday || '').trim();
  }

  public getDeathday(): string {
    if (!this.person) {
      return '';
    }

    return String(this.person.deathday || '').trim();
  }

  public getPlaceOfBirth(): string {
    if (!this.person) {
      return '';
    }

    return String(this.person.place_of_birth || '').trim();
  }

  public getAge(): number | null {
    const birthday = this.getBirthday();

    if (!birthday) {
      return null;
    }

    const birthDate = new Date(birthday);

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const deathday = this.getDeathday();
    const endDate = deathday ? new Date(deathday) : new Date();

    if (Number.isNaN(endDate.getTime())) {
      return null;
    }

    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDifference = endDate.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && endDate.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  public getDisplayTitle(item: TmdbPersonCreditListItem): string {
    const movieTitle = String(item.title || item.original_title || '').trim();
    const tvTitle = String(item.name || item.original_name || '').trim();

    if (movieTitle.length > 0) {
      return movieTitle;
    }

    return tvTitle;
  }

  public getDisplayDate(item: TmdbPersonCreditListItem): string {
    const releaseDate = String(item.release_date || '').trim();
    const firstAirDate = String(item.first_air_date || '').trim();

    if (releaseDate.length > 0) {
      return releaseDate;
    }

    return firstAirDate;
  }

  public getDisplayYear(item: TmdbPersonCreditListItem): string {
    const dateValue = this.getDisplayDate(item);

    if (!dateValue || dateValue.length < 4) {
      return '';
    }

    return dateValue.slice(0, 4);
  }

  public getCreditRole(item: TmdbPersonCreditListItem): string {
    const character = String(item.character || '').trim();
    const job = String(item.job || '').trim();
    const department = String(item.department || '').trim();

    if (character.length > 0) {
      return character;
    }

    if (job.length > 0) {
      return job;
    }

    if (department.length > 0) {
      return department;
    }

    return '';
  }

  public getMediaTypeLabel(item: TmdbPersonCreditListItem): string {
    if (item.media_type === 'movie') {
      return 'Movie';
    }

    return 'Series';
  }

  public getCreditTypeLabel(item: TmdbPersonCreditListItem): string {
    if (item.credit_type === 'cast') {
      return 'Cast';
    }

    return 'Crew';
  }

  public formatMoney(value: number | null): string {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return '';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  public formatVoteAverage(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '';
    }

    return value.toFixed(1);
  }

  public trackByCredit(index: number, item: TmdbPersonCreditListItem): string {
    return `${item.media_type}-${item.credit_id}-${item.id}`;
  }

  public trackByPopularMovie(index: number, item: TmdbPersonCreditListItem): string {
    return `${item.media_type}-${item.id}`;
  }
}