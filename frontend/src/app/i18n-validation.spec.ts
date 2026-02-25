/**
 * Translation file validation tests.
 * Uses HTTP fetch to load JSON files since Karma runs in a browser context.
 */
import en from '../assets/i18n/en.json';
import pt from '../assets/i18n/pt.json';
import es from '../assets/i18n/es.json';

describe('Translation files (i18n)', () => {

  function getKeys(obj: Record<string, any>, prefix = ''): string[] {
    const keys: string[] = [];
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getKeys(obj[key] as Record<string, any>, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    return keys.sort();
  }

  it('en.json should be valid', () => {
    expect(en).toBeTruthy();
    expect(typeof en).toBe('object');
  });

  it('pt.json should be valid', () => {
    expect(pt).toBeTruthy();
    expect(typeof pt).toBe('object');
  });

  it('es.json should be valid', () => {
    expect(es).toBeTruthy();
    expect(typeof es).toBe('object');
  });

  it('pt.json should have the same keys as en.json', () => {
    const enKeys = getKeys(en);
    const ptKeys = getKeys(pt);
    const missingInPt = enKeys.filter(k => !ptKeys.includes(k));
    const extraInPt = ptKeys.filter(k => !enKeys.includes(k));

    expect(missingInPt).withContext(`Keys missing in pt.json: ${missingInPt.join(', ')}`).toEqual([]);
    expect(extraInPt).withContext(`Extra keys in pt.json: ${extraInPt.join(', ')}`).toEqual([]);
  });

  it('es.json should have the same keys as en.json', () => {
    const enKeys = getKeys(en);
    const esKeys = getKeys(es);
    const missingInEs = enKeys.filter(k => !esKeys.includes(k));
    const extraInEs = esKeys.filter(k => !enKeys.includes(k));

    expect(missingInEs).withContext(`Keys missing in es.json: ${missingInEs.join(', ')}`).toEqual([]);
    expect(extraInEs).withContext(`Extra keys in es.json: ${extraInEs.join(', ')}`).toEqual([]);
  });

  // --- MATCH_STATUS keys ---

  it('en.json should have all required MATCH_STATUS keys', () => {
    const requiredKeys = ['LIVE', 'FT', 'HT', 'UPCOMING', 'PAUSED', 'POSTPONED', 'CANCELLED', 'UNKNOWN'];
    for (const key of requiredKeys) {
      expect((en as any)['MATCH_STATUS']?.[key])
        .withContext(`MATCH_STATUS.${key} missing in en.json`)
        .toBeDefined();
    }
  });

  it('pt.json should have all required MATCH_STATUS keys', () => {
    const requiredKeys = ['LIVE', 'FT', 'HT', 'UPCOMING', 'PAUSED', 'POSTPONED', 'CANCELLED', 'UNKNOWN'];
    for (const key of requiredKeys) {
      expect((pt as any)['MATCH_STATUS']?.[key])
        .withContext(`MATCH_STATUS.${key} missing in pt.json`)
        .toBeDefined();
    }
  });

  it('es.json should have all required MATCH_STATUS keys', () => {
    const requiredKeys = ['LIVE', 'FT', 'HT', 'UPCOMING', 'PAUSED', 'POSTPONED', 'CANCELLED', 'UNKNOWN'];
    for (const key of requiredKeys) {
      expect((es as any)['MATCH_STATUS']?.[key])
        .withContext(`MATCH_STATUS.${key} missing in es.json`)
        .toBeDefined();
    }
  });

  // --- No empty values ---

  it('should not have empty string values in en.json', () => {
    const allKeys = getKeys(en);
    const emptyKeys = allKeys.filter(key => {
      const parts = key.split('.');
      let val: any = en;
      for (const part of parts) val = val?.[part];
      return val === '';
    });
    expect(emptyKeys).withContext(`Empty values in en.json: ${emptyKeys.join(', ')}`).toEqual([]);
  });

  // --- NAV section ---

  it('all languages should have NAV.LOGOUT', () => {
    expect((en as any)['NAV']?.['LOGOUT']).toBeDefined();
    expect((pt as any)['NAV']?.['LOGOUT']).toBeDefined();
    expect((es as any)['NAV']?.['LOGOUT']).toBeDefined();
  });

  // --- Top-level sections ---

  it('all languages should have consistent top-level sections', () => {
    const enSections = Object.keys(en).sort();
    const ptSections = Object.keys(pt).sort();
    const esSections = Object.keys(es).sort();

    expect(ptSections).withContext('pt.json top-level sections mismatch').toEqual(enSections);
    expect(esSections).withContext('es.json top-level sections mismatch').toEqual(enSections);
  });
});
