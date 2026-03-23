import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowCeleb } from './show-celeb';

describe('ShowCeleb', () => {
  let component: ShowCeleb;
  let fixture: ComponentFixture<ShowCeleb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowCeleb]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowCeleb);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
