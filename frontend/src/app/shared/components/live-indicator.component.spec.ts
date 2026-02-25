import { LiveIndicatorComponent } from './live-indicator.component';

describe('LiveIndicatorComponent', () => {
  let component: LiveIndicatorComponent;

  beforeEach(() => {
    component = new LiveIndicatorComponent();
  });

  // --- Object guard ---

  it('handles object input by extracting .status property', () => {
    component.status = { status: 'IN_PLAY', score: { home: 1 } };
    component.ngOnInit();
    expect(component.isLive).toBe(true);
    expect(component.displayText).toBe('MATCH_STATUS.LIVE');
  });

  it('handles object input by extracting .short property when no .status', () => {
    component.status = { short: 'FT', long: 'Full Time' };
    component.ngOnInit();
    expect(component.isLive).toBe(false);
    expect(component.displayText).toBe('MATCH_STATUS.FT');
  });

  it('handles object with neither .status nor .short gracefully', () => {
    component.status = { id: 123, name: 'something' };
    component.ngOnInit();
    // rawStatus is '' when object has no .status or .short, so fallback is MATCH_STATUS.UNKNOWN
    expect(component.displayText).toBe('MATCH_STATUS.UNKNOWN');
    expect(component.isLive).toBe(false);
  });

  it('does not produce [object Object] as displayText', () => {
    component.status = { foo: 'bar' };
    component.ngOnInit();
    expect(component.displayText).not.toContain('[object Object]');
  });

  // --- Live status detection ---

  it('detects IN_PLAY as live', () => {
    component.status = 'IN_PLAY';
    component.ngOnInit();
    expect(component.isLive).toBe(true);
    expect(component.badgeColor).toBe('danger');
    expect(component.displayText).toBe('MATCH_STATUS.LIVE');
  });

  it('detects LIVE as live', () => {
    component.status = 'LIVE';
    component.ngOnInit();
    expect(component.isLive).toBe(true);
    expect(component.displayText).toBe('MATCH_STATUS.LIVE');
  });

  it('detects HALFTIME as live with HT text', () => {
    component.status = 'HALFTIME';
    component.ngOnInit();
    expect(component.isLive).toBe(true);
    expect(component.displayText).toBe('MATCH_STATUS.HT');
  });

  it('detects PAUSED as live with PAUSED text', () => {
    component.status = 'PAUSED';
    component.ngOnInit();
    expect(component.isLive).toBe(true);
    expect(component.displayText).toBe('MATCH_STATUS.PAUSED');
  });

  // --- Finished status ---

  it('detects FT as finished', () => {
    component.status = 'FT';
    component.ngOnInit();
    expect(component.isLive).toBe(false);
    expect(component.badgeColor).toBe('medium');
    expect(component.displayText).toBe('MATCH_STATUS.FT');
  });

  it('detects FINISHED as finished', () => {
    component.status = 'FINISHED';
    component.ngOnInit();
    expect(component.isLive).toBe(false);
    expect(component.displayText).toBe('MATCH_STATUS.FT');
  });

  // --- Scheduled status ---

  it('detects SCHEDULED as upcoming', () => {
    component.status = 'SCHEDULED';
    component.ngOnInit();
    expect(component.isLive).toBe(false);
    expect(component.badgeColor).toBe('primary');
    expect(component.displayText).toBe('MATCH_STATUS.UPCOMING');
  });

  it('detects NS as upcoming', () => {
    component.status = 'NS';
    component.ngOnInit();
    expect(component.displayText).toBe('MATCH_STATUS.UPCOMING');
  });

  it('detects TIMED as upcoming', () => {
    component.status = 'TIMED';
    component.ngOnInit();
    expect(component.displayText).toBe('MATCH_STATUS.UPCOMING');
  });

  // --- Special statuses ---

  it('detects POSTPONED', () => {
    component.status = 'POSTPONED';
    component.ngOnInit();
    expect(component.badgeColor).toBe('warning');
    expect(component.displayText).toBe('MATCH_STATUS.POSTPONED');
  });

  it('detects CANCELLED', () => {
    component.status = 'CANCELLED';
    component.ngOnInit();
    expect(component.badgeColor).toBe('danger');
    expect(component.displayText).toBe('MATCH_STATUS.CANCELLED');
  });

  // --- Edge cases ---

  it('handles null status', () => {
    component.status = null;
    component.ngOnInit();
    expect(component.displayText).toBe('MATCH_STATUS.UNKNOWN');
    expect(component.isLive).toBe(false);
  });

  it('handles undefined status', () => {
    component.status = undefined;
    component.ngOnInit();
    expect(component.displayText).toBe('MATCH_STATUS.UNKNOWN');
  });

  it('handles empty string status', () => {
    component.status = '';
    component.ngOnInit();
    expect(component.displayText).toBe('MATCH_STATUS.UNKNOWN');
  });

  it('is case-insensitive', () => {
    component.status = 'in_play';
    component.ngOnInit();
    expect(component.isLive).toBe(true);
  });

  // --- ngOnChanges ---

  it('updates display on ngOnChanges', () => {
    component.status = 'FT';
    component.ngOnInit();
    expect(component.displayText).toBe('MATCH_STATUS.FT');

    component.status = 'LIVE';
    component.ngOnChanges();
    expect(component.isLive).toBe(true);
    expect(component.displayText).toBe('MATCH_STATUS.LIVE');
  });

  // --- Minute display ---

  it('stores minute input', () => {
    component.minute = 45;
    expect(component.minute).toBe(45);
  });

  it('animate defaults to true', () => {
    expect(component.animate).toBe(true);
  });
});
