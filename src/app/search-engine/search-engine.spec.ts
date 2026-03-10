import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchEngine } from './search-engine';

describe('SearchEngine', () => {
  let component: SearchEngine;
  let fixture: ComponentFixture<SearchEngine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchEngine]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchEngine);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
