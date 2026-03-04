import { describe, expect, it } from 'vitest';
import { getPreviewStats } from './useWordsCounter';

describe('getPreviewStats', () => {
  it('restituisce zero statistiche per input vuoto', () => {
    expect(getPreviewStats('')).toEqual({ words: 0, chars: 0 });
  });

  it('rimuove i marcatori di titolo (#) dal testo', () => {
    const stats = getPreviewStats('# Heading');
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe('Heading'.length);
  });

  it('rimuove la formattazione grassetto e corsivo', () => {
    const stats = getPreviewStats('**bold** _italic_');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('bold italic'.length);
  });

  it('rimuove la sintassi barrato', () => {
    const stats = getPreviewStats('~~strike~~ text');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('strike text'.length);
  });

  it('ignora completamente le immagini', () => {
    const stats = getPreviewStats('text ![alt](img.png) more');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('text  more'.length); // two spaces where image was removed
  });

  it('mantiene il testo del collegamento ma rimuove l\'URL', () => {
    const stats = getPreviewStats('[click](http://x)');
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe('click'.length);
  });

  it('rimuove i frammenti di codice inline mantenendo il contenuto', () => {
    const stats = getPreviewStats('`code` snippet');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('code snippet'.length);
  });

  it('rimuove i punti elenco non ordinati', () => {
    const stats = getPreviewStats('- item\n* item2\n+ item3');
    expect(stats.words).toBe(3);
  });

  it('rimuove i numeri degli elenchi ordinati', () => {
    const stats = getPreviewStats('1. one\n2. two');
    expect(stats.words).toBe(2);
  });

  it('rimuove markdown e conta correttamente le parole', () => {
    const markdown = '# Title\n\n**bold** _italic_ [link](https://example.com)';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(4);
  });

  it('rimuove markdown e conta correttamente i caratteri', () => {
    const markdown = '# Title\n\n**bold** _italic_ [link](https://example.com)';
    const stats = getPreviewStats(markdown);

    expect(stats.chars).toBe('Title\n\nbold italic link'.length);
  });

  it('gestisce correttamente gli elenchi', () => {
    const markdown = '- one\n- two';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(2);
  });

  it('mantiene il testo del codice ma rimuove le immagini', () => {
    const markdown = '`code` ![img](x.png)';
    const stats = getPreviewStats(markdown);

    expect(stats.words).toBe(1);
  });

  it('preserva i caratteri di formattazione non abbinati', () => {
    const stats = getPreviewStats('****__~~');
    // **: becomes empty, __: becomes empty, ~~ remains as one "word"
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe(2); // just ~~
  });

  it('gestisce correttamente i marcatori di formattazione annidati', () => {
    const stats = getPreviewStats('**bold _nested_**');
    expect(stats.words).toBe(2);
    expect(stats.chars).toBe('bold nested'.length);
  });

  it('conta i caratteri inclusi gli spazi bianchi, le parole dal split trimato', () => {
    const stats = getPreviewStats('   text   ');
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe(10);
  });

  it('restituisce zero parole per il testo solo spazi bianchi', () => {
    const stats = getPreviewStats('\n\n');
    expect(stats.words).toBe(0);
    expect(stats.chars).toBe(2);
  });

  it('gestisce input molto lungo senza rompere', () => {
    const long = '#'.repeat(1000) + ' word';
    const stats = getPreviewStats(long);
    // The heading regex strips the leading hashes and space, leaving only 'word'
    expect(stats.words).toBe(1);
    expect(stats.chars).toBe(4);
  });
});
