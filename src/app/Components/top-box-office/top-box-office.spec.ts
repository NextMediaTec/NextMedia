import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopBoxOffice } from './top-box-office';

describe('TopBoxOffice', () => {
  let component: TopBoxOffice;
  let fixture: ComponentFixture<TopBoxOffice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBoxOffice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopBoxOffice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
