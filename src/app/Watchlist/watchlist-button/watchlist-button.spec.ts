import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchlistButton } from './watchlist-button';

describe('WatchlistButton', () => {
  let component: WatchlistButton;
  let fixture: ComponentFixture<WatchlistButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchlistButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WatchlistButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
