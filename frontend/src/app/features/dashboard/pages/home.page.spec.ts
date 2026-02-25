import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { HomePage } from './home.page';
import { ApiService } from '../../../core/services/api.service';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let mockApi: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    mockApi = jasmine.createSpyObj('ApiService', ['ping', 'getTeamMatches']);
    mockApi.ping.and.returnValue(of({ status: 'ok' }));
    mockApi.getTeamMatches.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomePage, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApi }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Season calculation ---

  it('should calculate season based on current month', () => {
    const now = new Date();
    const expectedSeason = now.getMonth() < 7
      ? now.getFullYear() - 1
      : now.getFullYear();
    expect(component.season).toBe(expectedSeason);
  });

  // --- pingBackend ---

  it('should call api.ping on init', () => {
    expect(mockApi.ping).toHaveBeenCalled();
  });

  it('should set pingResult on successful ping', () => {
    expect(component.pingResult).toEqual({ status: 'ok' });
    expect(component.loading).toBe(false);
  });

  it('should set error pingResult on failed ping', fakeAsync(() => {
    mockApi.ping.and.returnValue(throwError(() => new Error('Network error')));
    component.pingBackend();
    tick();
    expect(component.pingResult).toEqual(jasmine.objectContaining({ error: true }));
    expect(component.pingResult.message).toContain('Network error');
    expect(component.loading).toBe(false);
  }));

  // --- fetchMatches ---

  it('should return early when teamId is null', () => {
    component.teamId = null;
    mockApi.getTeamMatches.calls.reset();
    component.fetchMatches();
    expect(mockApi.getTeamMatches).not.toHaveBeenCalled();
  });

  it('should set fixtures and matchResult on success', fakeAsync(() => {
    const mockFixtures = [
      { id: 1, homeTeam: { name: 'Team A' } },
      { id: 2, homeTeam: { name: 'Team B' } },
    ];
    mockApi.getTeamMatches.and.returnValue(of(mockFixtures));
    component.teamId = 33;
    component.fetchMatches();
    tick();
    expect(component.fixtures).toEqual(mockFixtures);
    expect(component.matchResult).toEqual(jasmine.objectContaining({ success: true, count: 2 }));
    expect(component.loadingMatches).toBe(false);
  }));

  it('should extract data from response object when not array', fakeAsync(() => {
    mockApi.getTeamMatches.and.returnValue(of({ data: [{ id: 1 }] }));
    component.teamId = 33;
    component.fetchMatches();
    tick();
    expect(component.fixtures.length).toBe(1);
  }));

  it('should handle fetchMatches error and clear fixtures', fakeAsync(() => {
    mockApi.getTeamMatches.and.returnValue(throwError(() => new Error('API down')));
    component.teamId = 33;
    component.fetchMatches();
    tick();
    expect(component.fixtures).toEqual([]);
    expect(component.matchResult).toEqual(jasmine.objectContaining({ error: true }));
    expect(component.loadingMatches).toBe(false);
  }));

  // --- prettyJson ---

  it('should return empty string for null input', () => {
    expect(component.prettyJson(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(component.prettyJson(undefined)).toBe('');
  });

  it('should highlight JSON keys', () => {
    const result = component.prettyJson({ name: 'test' }) as any;
    // SafeHtml wraps the value; convert to string for assertion
    const html = typeof result === 'string' ? result : (result?.changingThisBreaksApplicationSecurity || result?.toString() || '');
    expect(html).toContain('json-key');
    expect(html).toContain('json-string');
  });

  it('should highlight numbers in JSON', () => {
    const result = component.prettyJson({ count: 42 }) as any;
    const html = typeof result === 'string' ? result : (result?.changingThisBreaksApplicationSecurity || result?.toString() || '');
    expect(html).toContain('json-number');
  });

  it('should highlight boolean values in JSON', () => {
    const result = component.prettyJson({ active: true }) as any;
    const html = typeof result === 'string' ? result : (result?.changingThisBreaksApplicationSecurity || result?.toString() || '');
    expect(html).toContain('json-boolean');
  });

  it('should highlight null values in JSON', () => {
    const result = component.prettyJson({ value: null }) as any;
    const html = typeof result === 'string' ? result : (result?.changingThisBreaksApplicationSecurity || result?.toString() || '');
    expect(html).toContain('json-null');
  });

  it('should highlight brackets in JSON', () => {
    const result = component.prettyJson({ items: [1, 2] }) as any;
    const html = typeof result === 'string' ? result : (result?.changingThisBreaksApplicationSecurity || result?.toString() || '');
    expect(html).toContain('json-bracket');
  });
});
