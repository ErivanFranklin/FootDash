import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FavoriteButtonComponent } from './favorite-button.component';
import { FavoritesService } from '../../services/favorites.service';

describe('FavoriteButtonComponent', () => {
  let component: FavoriteButtonComponent;
  let fixture: ComponentFixture<FavoriteButtonComponent>;

  const mockFavoritesService = {
    isFavoriteLocal: jasmine.createSpy('isFavoriteLocal'),
    isFavorite: jasmine.createSpy('isFavorite'),
    addFavorite: jasmine.createSpy('addFavorite'),
    removeFavorite: jasmine.createSpy('removeFavorite'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoriteButtonComponent],
      providers: [
        { provide: FavoritesService, useValue: mockFavoritesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FavoriteButtonComponent);
    component = fixture.componentInstance;
    component.entityType = 'team';
    component.entityId = 42;
  });

  beforeEach(() => {
    mockFavoritesService.isFavoriteLocal.calls.reset();
    mockFavoritesService.isFavorite.calls.reset();
    mockFavoritesService.addFavorite.calls.reset();
    mockFavoritesService.removeFavorite.calls.reset();
    mockFavoritesService.isFavoriteLocal.and.returnValue(false);
    mockFavoritesService.isFavorite.and.returnValue(of({ isFavorite: false }));
    mockFavoritesService.addFavorite.and.returnValue(of({}));
    mockFavoritesService.removeFavorite.and.returnValue(of({}));
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('preserves cached favorite state when status check fails', fakeAsync(() => {
    mockFavoritesService.isFavoriteLocal.and.returnValue(true);
    mockFavoritesService.isFavorite.and.returnValue(
      throwError(() => new Error('Not Found')),
    );

    fixture.detectChanges();
    tick();

    expect(component.isFavorite).toBeTrue();
  }));

  it('uses remote favorite state when status check succeeds', fakeAsync(() => {
    mockFavoritesService.isFavoriteLocal.and.returnValue(false);
    mockFavoritesService.isFavorite.and.returnValue(of({ isFavorite: true }));

    fixture.detectChanges();
    tick();

    expect(component.isFavorite).toBeTrue();
  }));
});