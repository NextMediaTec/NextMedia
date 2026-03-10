import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { ref, onValue, Unsubscribe } from 'firebase/database';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SearchEngine } from '../search-engine/search-engine';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';





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

  constructor(
    private firebase: FirebaseService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private router: Router
  ) {}

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
    try{
      await this.authService.logout();
      await this.router.navigate(['/login']);
    }catch (error) {
      console.error('Logout failed:', error);
    }
  }

  private isAvatarIdValid(avatarId: string): boolean {
    return this.avatarOptions.some(a => a.id === avatarId);
  }
}