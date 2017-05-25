import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverPreferenceComponent } from './cover-preference.component';

describe('CoverPreferenceComponent', () => {
  let component: CoverPreferenceComponent;
  let fixture: ComponentFixture<CoverPreferenceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CoverPreferenceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CoverPreferenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
