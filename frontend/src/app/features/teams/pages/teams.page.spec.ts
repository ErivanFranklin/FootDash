import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TeamsPage } from './teams.page';
import { ApiService } from '../../../core/services/api.service';
import { FavoritesService } from '../../../services/favorites.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

describe('TeamsPage', () => {
  const createToastMock = () => ({
    present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
  });

  const setup = () => {
    const apiMock = {
      getTeams: jasmine.createSpy('getTeams').and.returnValue(
        of({
          data: [{ id: 1, name: 'Arsenal', shortCode: 'ARS' }],
          total: 1,
        }),
      ),
      getTeam: jasmine.createSpy('getTeam').and.returnValue(of({ data: { id: 1, name: 'Arsenal' } })),
      syncTeam: jasmine.createSpy('syncTeam').and.returnValue(of({ ok: true })),
    };

    const favoritesMock = {
      loadFavorites: jasmine.createSpy('loadFavorites').and.returnValue(of([])),
    };

    const routerMock = {
      navigate: jasmine.createSpy('navigate'),
    };

    const routeMock = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue(null),
        },
      },
    };

    const toastControllerMock = {
      create: jasmine.createSpy('create').and.callFake(async () => createToastMock()),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: FavoritesService, useValue: favoritesMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ToastController, useValue: toastControllerMock },
      ],
    });

    const page = TestBed.runInInjectionContext(() => new TeamsPage());

    return {
      page,
      apiMock,
      favoritesMock,
      routerMock,
      routeMock,
      toastControllerMock,
    };
  };

  it('loads teams on init', () => {
    const { page, apiMock } = setup();

    page.ngOnInit();

    expect(apiMock.getTeams).toHaveBeenCalled();
    expect(page.teams.length).toBe(1);
    expect(page.loading).toBeFalse();
  });

  it('filters visible teams by search term', () => {
    const { page } = setup();
    page.teams = [
      { id: 1, name: 'Arsenal', shortCode: 'ARS' },
      { id: 2, name: 'Chelsea', shortCode: 'CHE' },
    ];
    page.searchTerm = 'ars';

    expect(page.visibleTeams.length).toBe(1);
    expect(page.visibleTeams[0].id).toBe(1);
  });

  it('loadTeams handles error and shows toast', async () => {
    const { page, apiMock, toastControllerMock } = setup();
    apiMock.getTeams.and.returnValue(throwError(() => new Error('boom')));

    page.loadTeams(1);

    await Promise.resolve();
    await Promise.resolve();

    expect(page.loading).toBeFalse();
    expect(toastControllerMock.create).toHaveBeenCalled();
  });

  it('loadMore completes immediately in favorites mode', () => {
    const { page } = setup();
    page.filterMode = 'favorites';
    const complete = jasmine.createSpy('complete');

    page.loadMore({ target: { complete } } as any);

    expect(complete).toHaveBeenCalled();
  });

  it('loadMore completes when no more data', () => {
    const { page } = setup();
    page.filterMode = 'all';
    page.hasMoreData = false;
    const complete = jasmine.createSpy('complete');

    page.loadMore({ target: { complete } } as any);

    expect(complete).toHaveBeenCalled();
  });

  it('loadMore appends next page data in all mode', () => {
    const { page, apiMock } = setup();
    page.filterMode = 'all';
    page.teams = [{ id: 1, name: 'Arsenal' }];
    page.currentPage = 1;
    page.totalTeams = 3;
    page.hasMoreData = true;
    apiMock.getTeams.and.returnValue(
      of({ data: [{ id: 2, name: 'Chelsea' }], total: 3 }),
    );
    const complete = jasmine.createSpy('complete');

    page.loadMore({ target: { complete } } as any);

    expect(apiMock.getTeams).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      search: undefined,
    });
    expect(page.teams.length).toBe(2);
    expect(page.currentPage).toBe(2);
    expect(complete).toHaveBeenCalled();
  });

  it('loadMore completes on API error', () => {
    const { page, apiMock } = setup();
    page.filterMode = 'all';
    page.hasMoreData = true;
    apiMock.getTeams.and.returnValue(throwError(() => new Error('load more failed')));
    const complete = jasmine.createSpy('complete');

    page.loadMore({ target: { complete } } as any);

    expect(complete).toHaveBeenCalled();
  });

  it('switches to favorites filter and loads favorites', () => {
    const { page } = setup();
    spyOn(page, 'loadFavoriteTeams');

    page.onFilterChange({ detail: { value: 'favorites' } } as any);

    expect(page.filterMode).toBe('favorites');
    expect(page.loadFavoriteTeams).toHaveBeenCalled();
  });

  it('switches to all filter and loads teams when cache is empty', () => {
    const { page } = setup();
    page.filterMode = 'favorites';
    page.teams = [];
    spyOn(page, 'loadTeams');

    page.onFilterChange({ detail: { value: 'all' } } as any);

    expect(page.filterMode).toBe('all');
    expect(page.selectedFavoriteTeamId).toBeNull();
    expect(page.loadTeams).toHaveBeenCalledWith(1);
  });

  it('refreshTeams routes to loadFavoriteTeams in favorites mode', () => {
    const { page } = setup();
    page.filterMode = 'favorites';
    spyOn(page, 'loadFavoriteTeams');

    page.refreshTeams();

    expect(page.loadFavoriteTeams).toHaveBeenCalled();
  });

  it('refreshTeams routes to first page in all mode', () => {
    const { page } = setup();
    page.filterMode = 'all';
    spyOn(page, 'loadTeams');

    page.refreshTeams();

    expect(page.currentPage).toBe(1);
    expect(page.loadTeams).toHaveBeenCalledWith(1);
  });

  it('loads favorites and resolves team details', () => {
    const { page, favoritesMock, apiMock } = setup();
    favoritesMock.loadFavorites.and.returnValue(
      of([{ entityId: 1 }, { entityId: 2 }] as any),
    );
    apiMock.getTeam.and.returnValues(
      of({ data: { id: 1, name: 'A' } }),
      of({ data: { id: 2, name: 'B' } }),
    );

    page.loadFavoriteTeams();

    expect(favoritesMock.loadFavorites).toHaveBeenCalledWith('team');
    expect(page.favoriteTeams.length).toBe(2);
  });

  it('handles favorites load error and shows toast', async () => {
    const { page, favoritesMock, toastControllerMock } = setup();
    favoritesMock.loadFavorites.and.returnValue(
      throwError(() => new Error('fav failed')),
    );

    page.loadFavoriteTeams();
    await Promise.resolve();
    await Promise.resolve();

    expect(page.favoriteTeams).toEqual([]);
    expect(page.loading).toBeFalse();
    expect(toastControllerMock.create).toHaveBeenCalled();
  });

  it('loads empty favorites without requesting team details', () => {
    const { page, favoritesMock, apiMock } = setup();
    favoritesMock.loadFavorites.and.returnValue(of([]));

    page.loadFavoriteTeams();

    expect(page.favoriteTeams).toEqual([]);
    expect(page.loading).toBeFalse();
    expect(apiMock.getTeam).not.toHaveBeenCalled();
  });

  it('trackByTeamId falls back to index when id fields are missing', () => {
    const { page } = setup();

    const id = page.trackByTeamId(8, { name: 'No ID' });

    expect(id).toBe(8);
  });

  it('resolveTeamId returns null for missing ids', () => {
    const { page } = setup();
    expect(page.resolveTeamId({})).toBeNull();
  });

  it('returns cached team actions and updates sync loading state', () => {
    const { page } = setup();
    const team = { id: 9, name: 'X' };
    const first = page.getTeamActions(team);
    page.syncingTeamIds.add(9);

    const second = page.getTeamActions(team);

    expect(first).toBe(second);
    expect(second[2].loading).toBeTrue();
  });

  it('navigates to matches and analytics when id is resolvable', () => {
    const { page, routerMock } = setup();

    page.viewMatches({ id: 11 });
    page.viewAnalytics({ id: 11 });

    expect(routerMock.navigate).toHaveBeenCalledWith(['/matches', 11]);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/analytics/team', 11]);
  });

  it('syncTeam executes success flow', async () => {
    const { page, apiMock, toastControllerMock } = setup();
    spyOn(page, 'loadTeams');

    await page.syncTeam({ id: 7 });

    expect(apiMock.syncTeam).toHaveBeenCalledWith(7);
    expect(page.loadTeams).toHaveBeenCalled();
    expect(toastControllerMock.create).toHaveBeenCalled();
  });

  it('syncTeam handles error flow and shows danger toast', async () => {
    const { page, apiMock, toastControllerMock } = setup();
    apiMock.syncTeam.and.returnValue(throwError(() => new Error('sync failed')));

    await page.syncTeam({ id: 7 });
    await Promise.resolve();
    await Promise.resolve();

    expect(page.syncingTeamIds.has(7)).toBeFalse();
    expect(toastControllerMock.create).toHaveBeenCalled();
  });

  it('view routes are no-op when id cannot be resolved', () => {
    const { page, routerMock } = setup();

    page.viewMatches({ id: null });
    page.viewAnalytics({ team: {} });

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('applies query filters from route on init', () => {
    const { page, routeMock } = setup();
    (routeMock.snapshot.queryParamMap.get as jasmine.Spy).and.callFake(
      (key: string) => {
        if (key === 'tab') return 'favorites';
        if (key === 'teamId') return '42';
        return null;
      },
    );
    spyOn(page, 'loadFavoriteTeams');
    spyOn(page, 'loadTeams');

    page.ngOnInit();

    expect(page.filterMode).toBe('favorites');
    expect(page.selectedFavoriteTeamId).toBe(42);
    expect(page.loadFavoriteTeams).toHaveBeenCalled();
    expect(page.loadTeams).toHaveBeenCalled();
  });

  it('debounces search in all mode and reloads page 1', fakeAsync(() => {
    const { page } = setup();
    page.filterMode = 'all';
    spyOn(page, 'loadTeams');

    page.onSearchChange({ detail: { value: 'chel' } });
    tick(299);
    expect(page.loadTeams).not.toHaveBeenCalled();

    tick(1);
    expect(page.searchTerm).toBe('chel');
    expect(page.loadTeams).toHaveBeenCalledWith(1);
  }));

  it('debounces search in favorites mode without reloading from API', fakeAsync(() => {
    const { page } = setup();
    page.filterMode = 'favorites';
    spyOn(page, 'loadTeams');

    page.onSearchChange({ detail: { value: 'ars' } });
    tick(300);

    expect(page.searchTerm).toBe('ars');
    expect(page.loadTeams).not.toHaveBeenCalled();
  }));
});
