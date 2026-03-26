import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { ref, onValue, Unsubscribe } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SearchEngine } from '../search-engine/search-engine';
import { AuthService } from '../services/auth.service';

interface NavbarMenuItem {
  label: string;
  route: string;
}

interface NavbarMenuSection {
  title: string;
  items: NavbarMenuItem[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SearchEngine],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {
  public loggedInUsername: string = 'Gæst';
  public loggedInEmail: string = '';
  public loggedInUid: string = '';
  public isLoggedIn: boolean = false;

  public defaultAvatarId: string = 'avatar-01';
  public loggedInAvatarId: string = 'avatar-01';

  public isBurgerMenuOpen: boolean = false;

  public avatarOptions: { id: string; src: string }[] = [
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

  private authUnsubscribe: (() => void) | null = null;
  private userProfileUnsubscribe: Unsubscribe | null = null;
  private routerEventsUnsubscribe: (() => void) | null = null;

  constructor(
    private firebase: FirebaseService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router
  ) {}

  public get burgerMenuSections(): NavbarMenuSection[] {
    return [
      {
        title: 'Movies',
        items: [
          { label: 'Browse By Genre Movies', route: '/browse-by-genre-movies' },
          { label: 'Most Popular Movies', route: '/most-popular-movies' },
          { label: 'Release Calendar Movies', route: '/show-release-calender-months' },
          { label: 'Top 250 Movies', route: '/top250-movies' },
          { label: 'Top Box Office', route: '/top-box-office' }
        ]
      },
      {
        title: 'Series',
        items: [
          { label: 'Browse By Genre Series', route: '/browse-by-genre-series' },
          { label: 'Most Popular Series', route: '/most-popular-series' },
          { label: 'Release Calendar Series', route: '/show-release-calender-months-series' },
          { label: 'Top 250 Series', route: '/top250-series' }
        ]
      },
      {
        title: 'Celebs',
        items: [
          { label: 'Celebs Born Today', route: '/celebs-born-today' },
          { label: 'Most Popular Celeb', route: '/most-popular-celeb' }
        ]
      }
    ];
  }

  ngOnInit(): void {
    this.authUnsubscribe = onAuthStateChanged(this.firebase.auth, (authUser: User | null) => {
      if (this.userProfileUnsubscribe) {
        this.userProfileUnsubscribe();
        this.userProfileUnsubscribe = null;
      }

      if (!authUser) {
        this.isLoggedIn = false;
        this.loggedInUsername = 'Gæst';
        this.loggedInEmail = '';
        this.loggedInUid = '';
        this.loggedInAvatarId = this.defaultAvatarId;
        this.cdr.detectChanges();
        return;
      }

      this.isLoggedIn = true;
      this.loggedInUid = authUser.uid;
      this.loggedInEmail = authUser.email || '';
      this.loggedInAvatarId = this.defaultAvatarId;

      if (authUser.displayName && authUser.displayName.trim().length > 0) {
        this.loggedInUsername = authUser.displayName;
      } else if (authUser.email && authUser.email.trim().length > 0) {
        this.loggedInUsername = authUser.email;
      } else {
        this.loggedInUsername = 'Bruger';
      }

      this.cdr.detectChanges();

      const userRef = ref(this.firebase.db, `users/${authUser.uid}`);

      this.userProfileUnsubscribe = onValue(userRef, (snapshot) => {
        if (!snapshot.exists()) {
          if (authUser.displayName && authUser.displayName.trim().length > 0) {
            this.loggedInUsername = authUser.displayName;
          } else if (authUser.email && authUser.email.trim().length > 0) {
            this.loggedInUsername = authUser.email;
          } else {
            this.loggedInUsername = 'Bruger';
          }

          this.loggedInEmail = authUser.email || '';
          this.loggedInAvatarId = this.defaultAvatarId;
          this.cdr.detectChanges();
          return;
        }

        const data = snapshot.val();
        const username = data?.username ?? null;
        const email = data?.email ?? null;
        const avatarId = data?.avatarId ?? null;

        if (typeof username === 'string' && username.trim().length > 0) {
          this.loggedInUsername = username;
        } else if (authUser.displayName && authUser.displayName.trim().length > 0) {
          this.loggedInUsername = authUser.displayName;
        } else if (typeof email === 'string' && email.trim().length > 0) {
          this.loggedInUsername = email;
        } else if (authUser.email && authUser.email.trim().length > 0) {
          this.loggedInUsername = authUser.email;
        } else {
          this.loggedInUsername = 'Bruger';
        }

        if (typeof email === 'string' && email.trim().length > 0) {
          this.loggedInEmail = email;
        } else {
          this.loggedInEmail = authUser.email || '';
        }

        if (typeof avatarId === 'string' && this.isAvatarIdValid(avatarId)) {
          this.loggedInAvatarId = avatarId;
        } else {
          this.loggedInAvatarId = this.defaultAvatarId;
        }

        this.cdr.detectChanges();
      });
    });

    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeBurgerMenu();
      }
    });

    this.routerEventsUnsubscribe = () => {
      routerSubscription.unsubscribe();
    };
  }

  ngOnDestroy(): void {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }

    if (this.userProfileUnsubscribe) {
      this.userProfileUnsubscribe();
      this.userProfileUnsubscribe = null;
    }

    if (this.routerEventsUnsubscribe) {
      this.routerEventsUnsubscribe();
      this.routerEventsUnsubscribe = null;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth > 1200 && this.isBurgerMenuOpen) {
      this.closeBurgerMenu();
    }
  }

  public toggleBurgerMenu(): void {
    this.isBurgerMenuOpen = !this.isBurgerMenuOpen;
  }

  public closeBurgerMenu(): void {
    this.isBurgerMenuOpen = false;
  }

  public getProfileRoute(): string {
    if (!this.loggedInUid || this.loggedInUid.trim().length === 0) {
      return '/profile';
    }

    return `/profile/${this.loggedInUid}`;
  }

  public getAvatarSrcById(avatarId: string): string {
    const found = this.avatarOptions.find(a => a.id === avatarId);
    if (found) {
      return found.src;
    }

    const fallback = this.avatarOptions.find(a => a.id === this.defaultAvatarId);
    if (fallback) {
      return fallback.src;
    }

    return 'assets/avatars/cat.png';
  }

  public async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.closeBurgerMenu();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  private isAvatarIdValid(avatarId: string): boolean {
    return this.avatarOptions.some(a => a.id === avatarId);
  }
}