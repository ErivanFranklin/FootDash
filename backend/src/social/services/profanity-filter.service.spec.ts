import { Test, TestingModule } from '@nestjs/testing';
import { ProfanityFilterService } from './profanity-filter.service';

describe('ProfanityFilterService', () => {
  let service: ProfanityFilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfanityFilterService],
    }).compile();

    service = module.get<ProfanityFilterService>(ProfanityFilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isProfane', () => {
    it('should detect profanity in text', () => {
      const result = service.isProfane('This is badword1 content');
      expect(result).toBe(true);
    });

    it('should be case-insensitive', () => {
      const result = service.isProfane('This is BADWORD1 content');
      expect(result).toBe(true);
    });

    it('should return false for clean content', () => {
      const result = service.isProfane('This is clean content');
      expect(result).toBe(false);
    });

    it('should return false for empty content', () => {
      const result = service.isProfane('');
      expect(result).toBe(false);
    });

    it('should return false for null content', () => {
      const result = service.isProfane(null);
      expect(result).toBe(false);
    });

    it('should detect multiple profanities', () => {
      const result = service.isProfane('badword1 and badword2');
      expect(result).toBe(true);
    });
  });

  describe('filterProfanity', () => {
    it('should replace profanity with asterisks', () => {
      const result = service.filterProfanity('This is badword1 content');
      expect(result).toBe('This is ******** content');
    });

    it('should be case-insensitive for filtering', () => {
      const result = service.filterProfanity('This is BADWORD1 content');
      expect(result).toBe('This is ******** content');
    });

    it('should not modify clean content', () => {
      const content = 'This is clean content';
      const result = service.filterProfanity(content);
      expect(result).toBe(content);
    });

    it('should return empty string as-is', () => {
      const result = service.filterProfanity('');
      expect(result).toBe('');
    });

    it('should filter multiple profanities', () => {
      const result = service.filterProfanity('badword1 and badword2');
      expect(result).toBe('******** and ********');
    });

    it('should preserve word boundaries', () => {
      const result = service.filterProfanity('badword1ing');
      // Should not filter as it's part of a larger word
      expect(result).toBe('badword1ing');
    });
  });

  describe('addBannedWord', () => {
    it('should add word to banned list', () => {
      service.addBannedWord('newbadword');
      const result = service.isProfane('This is newbadword content');
      expect(result).toBe(true);
    });

    it('should be case-insensitive when adding', () => {
      service.addBannedWord('NEWBADWORD');
      const result = service.isProfane('this is newbadword content');
      expect(result).toBe(true);
    });
  });

  describe('removeBannedWord', () => {
    it('should remove word from banned list', () => {
      service.addBannedWord('tempbadword');
      expect(service.isProfane('tempbadword')).toBe(true);

      service.removeBannedWord('tempbadword');
      expect(service.isProfane('tempbadword')).toBe(false);
    });
  });

  describe('getBannedWords', () => {
    it('should return array of banned words', () => {
      const words = service.getBannedWords();
      expect(Array.isArray(words)).toBe(true);
      expect(words.length).toBeGreaterThan(0);
    });

    it('should include default banned words', () => {
      const words = service.getBannedWords();
      expect(words).toContain('badword1');
      expect(words).toContain('badword2');
    });
  });
});
