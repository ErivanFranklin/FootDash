import { Injectable } from '@nestjs/common';

@Injectable()
export class ProfanityFilterService {
  // List of inappropriate words/phrases to filter
  private readonly bannedWords: Set<string> = new Set([
    'badword1',
    'badword2',
    'offensive',
    'inappropriate',
    'spam',
    'abuse',
  ]);

  /**
   * Check if content contains profanity/inappropriate language
   */
  isProfane(content: string): boolean {
    if (!content) return false;

    const lowerContent = content.toLowerCase();
    for (const word of this.bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(lowerContent)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Filter profanity from content by replacing with asterisks
   */
  filterProfanity(content: string): string {
    if (!content) return content;

    let filtered = content;
    for (const word of this.bannedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const replacement = '*'.repeat(word.length);
      filtered = filtered.replace(regex, replacement);
    }
    return filtered;
  }

  /**
   * Add word to banned words list (admin function)
   */
  addBannedWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  /**
   * Remove word from banned words list (admin function)
   */
  removeBannedWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase());
  }

  /**
   * Get all banned words (admin function)
   */
  getBannedWords(): string[] {
    return Array.from(this.bannedWords);
  }
}
