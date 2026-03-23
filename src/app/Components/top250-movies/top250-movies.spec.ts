import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Top250Movies } from './top250-movies';

describe('Top250Movies', () => {
  let component: Top250Movies;
  let fixture: ComponentFixture<Top250Movies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Top250Movies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Top250Movies);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
