import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CelebsBornToday } from './celebs-born-today';

describe('CelebsBornToday', () => {
  let component: CelebsBornToday;
  let fixture: ComponentFixture<CelebsBornToday>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CelebsBornToday]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CelebsBornToday);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
