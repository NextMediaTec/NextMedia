import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMovie } from './show-movie';

describe('ShowMovie', () => {
  let component: ShowMovie;
  let fixture: ComponentFixture<ShowMovie>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMovie]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowMovie);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
