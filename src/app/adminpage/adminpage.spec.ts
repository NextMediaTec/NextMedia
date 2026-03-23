import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Adminpage } from './adminpage';

describe('Adminpage', () => {
  let component: Adminpage;
  let fixture: ComponentFixture<Adminpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adminpage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Adminpage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
