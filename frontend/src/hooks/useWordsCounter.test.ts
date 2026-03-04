import { describe, expect, it } from 'vitest';
import { getPreviewStats } from './useWordsCounter';

describe('getPreviewStats', () => {
  it('returns zero stats for empty input', () => {
    expect(getPreviewStats('')).toEqual({ words: 0, chars: 0 });
  });

  it('removes heading markers (#) from text', () => {
    const stats = getPreviewStats('# Heading');
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe('Heading'.length);
  });

  it('strips bold and italic formatting', () => {
    const stats = getPreviewStats('**bold** _italic_');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('bold italic'.length);
  });

  it('removes strikethrough syntax', () => {
    const stats = getPreviewStats('~~strike~~ text');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('strike text'.length);
  });

  it('ignores images completely', () => {
    const stats = getPreviewStats('text ![alt](img.png) more');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('text  more'.length); // two spaces where image was removed
  });

  it('keeps link text but removes URL', () => {
    const stats = getPreviewStats('[click](http://x)');
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe('click'.length);
  });

  it('removes inline code spans and keeps the content', () => {
    const stats = getPreviewStats('`code` snippet');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('code snippet'.length);
  });

  it('removes unordered list bullets', () => {
    const stats = getPreviewStats('- item\n* item2\n+ item3');
    expect(stats.words).toBe(3);
  });

  it('removes ordered list numbers', () => {
    const stats = getPreviewStats('1. one\n2. two');
    expect(stats.words).toBe(2);
  });

  it('strips markdown and counts words correctly', () => {
    const markdown = '# Title\n\n**bold** _italic_ [link](https://example.com)';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(4);
  });

  it('strips markdown and counts characters correctly', () => {
    const markdown = '# Title\n\n**bold** _italic_ [link](https://example.com)';
    const stats = getPreviewStats(markdown);

    expect(stats.chars).toBe('Title\n\nbold italic link'.length);
  });

  it('handles lists correctly', () => {
    const markdown = '- one\n- two';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(2);
  });

  it('keeps code text but removes images', () => {
    const markdown = '`code` ![img](x.png)';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(1);
  });

  it('preserves unmatched formatting characters', () => {
    const stats = getPreviewStats('****__~~');
    // **: becomes empty, __: becomes empty, ~~ remains as one "word"
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe(2); // just ~~
  });

  it('handles nested formatting markers correctly', () => {
    const stats = getPreviewStats('**bold _nested_**');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('bold nested'.length);
  });

  it('counts chars including whitespace, words from trimmed split', () => {
    const stats = getPreviewStats('   text   ');
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe(10);
  });

  it('returns zero words for whitespace-only text', () => {
    const stats = getPreviewStats('\n\n');
    expect(stats.words).toBe(0);
    expect(stats.chars).toBe(2);
  });

  it('handles very long input without breaking', () => {
    const long = '#'.repeat(1000) + ' word';
    const stats = getPreviewStats(long);
    // The heading regex strips the leading hashes and space, leaving only 'word'
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe(4);
  });
});
