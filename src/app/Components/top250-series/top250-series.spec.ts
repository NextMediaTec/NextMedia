import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Top250Series } from './top250-series';

describe('Top250Series', () => {
  let component: Top250Series;
  let fixture: ComponentFixture<Top250Series>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Top250Series]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Top250Series);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
