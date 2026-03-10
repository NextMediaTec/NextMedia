import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { Unsubscribe } from 'firebase/database';
import { SearchEngineService, SearchEngineUserResult } from '../services/search-engine.service';

@Component({
  selector: 'app-search-engine',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './search-engine.html',
  styleUrl: './search-engine.scss'
})
export class SearchEngine implements OnInit, OnDestroy {
  public searchText: string = '';
  public allUsers: SearchEngineUserResult[] = [];
  public filteredUsers: SearchEngineUserResult[] = [];
  public showResults: boolean = false;

  private usersUnsubscribe: Unsubscribe | null = null;

  constructor(
    private searchEngineService: SearchEngineService,
    private router: Router
  ) {}

  public ngOnInit(): void {
    this.usersUnsubscribe = this.searchEngineService.subscribeAllUsers((items: SearchEngineUserResult[]) => {
      this.allUsers = items;
      this.applyFilter();
    });
  }

  public ngOnDestroy(): void {
    if (this.usersUnsubscribe) {
      this.usersUnsubscribe();
      this.usersUnsubscribe = null;
    }
  }

  public onSearchInput(): void {
    this.applyFilter();
  }

  public onSearchFocus(): void {
    this.applyFilter();
  }

  public onSearchBlur(): void {
    setTimeout(() => {
      this.showResults = false;
    }, 150);
  }

  public openUserProfile(user: SearchEngineUserResult): void {
    const safeUid = (user?.uid || '').trim();

    if (safeUid.length === 0) {
      return;
    }

    this.showResults = false;
    this.searchText = user.username;
    this.router.navigate(['/profile', safeUid]);
  }

  private applyFilter(): void {
    const q = this.searchText.trim().toLowerCase();

    if (q.length === 0) {
      this.filteredUsers = [];
      this.showResults = false;
      return;
    }

    const matches: SearchEngineUserResult[] = [];

    for (let i = 0; i < this.allUsers.length; i++) {
      const user = this.allUsers[i];
      const username = (user.username || '').toLowerCase();

      if (username.includes(q)) {
        matches.push(user);
      }
    }

    this.filteredUsers = matches.slice(0, 10);
    this.showResults = this.filteredUsers.length > 0;
  }
}