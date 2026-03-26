import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWatchlist } from './user-watchlist';

describe('UserWatchlist', () => {
  let component: UserWatchlist;
  let fixture: ComponentFixture<UserWatchlist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserWatchlist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserWatchlist);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
