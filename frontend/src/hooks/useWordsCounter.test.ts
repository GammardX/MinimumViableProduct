import { describe, expect, it } from 'vitest';
import { getPreviewStats } from './useWordsCounter';

describe('getPreviewStats', () => {
  it('returns zero stats for empty input', () => {
    expect(getPreviewStats('')).toEqual({ words: 0, chars: 0 });
  });

  it('strips markdown formatting before counting', () => {
    const markdown = '# Title\n\n**bold** _italic_ [link](https://example.com)';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(4);
    expect(stats.chars).toBe('Title\n\nbold italic link'.length);
  });

  it('handles lists, code and images', () => {
    const markdown = '- one\n- two\n`code` ![img](x.png)';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(3);
  });
});
