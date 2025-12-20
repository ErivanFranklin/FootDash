import { extractMentions, snippetAround } from './mention-parser';

describe('mention-parser', () => {
  it('extracts basic mentions', () => {
    expect(extractMentions('hello @alice and @bob')).toEqual(['alice', 'bob']);
  });

  it('ignores emails', () => {
    expect(extractMentions('contact me test@example.com @joe')).toEqual([
      'joe',
    ]);
  });

  it('handles punctuation and boundaries', () => {
    expect(extractMentions('Hey, @alice!')).toEqual(['alice']);
    expect(extractMentions('(@alice) and _@bob_ should match')).toEqual([
      'alice',
      'bob',
    ]);
  });

  it('deduplicates and is case-insensitive', () => {
    expect(extractMentions('@Alice @alice @ALICE')).toEqual(['alice']);
  });

  it('snippetAround captures context', () => {
    const text = 'Hi @alice, please review the latest match summary here.';
    const snippet = snippetAround(text, 'alice', 10);
    expect(snippet).toContain('@alice');
    expect(snippet.length).toBeGreaterThan(0);
  });
});
