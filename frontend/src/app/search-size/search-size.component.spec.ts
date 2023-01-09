import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchSizeComponent } from './search-size.component';

describe('SearchSizeComponent', () => {
  let component: SearchSizeComponent;
  let fixture: ComponentFixture<SearchSizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchSizeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchSizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
