import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostPopularCeleb } from './most-popular-celeb';

describe('MostPopularCeleb', () => {
  let component: MostPopularCeleb;
  let fixture: ComponentFixture<MostPopularCeleb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostPopularCeleb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MostPopularCeleb);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
