import {
  applySixHats,
  checkTextSimilarity,
  generateText,
  improveWriting,
  summarizeText,
  translate,
  wakeUpServer,
  type LLMResponse,
} from './llmService';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('llmService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('summarizeText invia il payload previsto e restituisce la risposta analizzata', async () => {
    const mockResponse: LLMResponse = {
      outcome: { status: 'success', code: 'OK' },
      data: { rewritten_text: 'summary' },
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });

    const abortController = new AbortController();
    const result = await summarizeText('text to summarize', 40, abortController.signal);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/llm/summarize',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'text to summarize', percentage: 40 }),
        signal: abortController.signal,
      }
    );
    expect(result).toEqual(mockResponse);
  });

  it('improveWriting utilizza il criterio predefinito', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        outcome: { status: 'success', code: 'OK' },
        data: { rewritten_text: 'improved text' },
      }),
    });

    await improveWriting('raw text');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/llm/improve',
      expect.objectContaining({
        body: JSON.stringify({
          text: 'raw text',
          criterion: 'chiarezza e stile professionale',
        }),
      })
    );
  });

  it('translate invia la lingua di destinazione', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        outcome: { status: 'success', code: 'OK' },
        data: { rewritten_text: 'translated text', detected_language: 'it' },
      }),
    });

    await translate('ciao', 'English');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/llm/translate',
      expect.objectContaining({
        body: JSON.stringify({ text: 'ciao', targetLanguage: 'English' }),
      })
    );
  });

  it('applySixHats invia il cappello selezionato', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        outcome: { status: 'success', code: 'OK' },
        data: { rewritten_text: 'hat output' },
      }),
    });

    await applySixHats('topic text', 'Blu');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/llm/six-hats',
      expect.objectContaining({
        body: JSON.stringify({ text: 'topic text', hat: 'Blu' }),
      })
    );
  });

  it('generateText utilizza i valori predefiniti per il contesto e il conteggio delle parole', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        outcome: { status: 'success', code: 'OK' },
        data: { rewritten_text: 'generated body' },
      }),
    });

    await generateText('prompt only');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/llm/generate',
      expect.objectContaining({
        body: JSON.stringify({
          prompt: 'prompt only',
          context_text: '',
          word_count: 300,
        }),
      })
    );
  });

  it('genera un errore di backend quando la risposta non è ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('internal error'),
    });

    await expect(summarizeText('x')).rejects.toThrow(
      'Backend error 500: internal error'
    );
  });

  it('checkTextSimilarity restituisce 0 per input mancanti e calcola la sovrapposizione', () => {
    expect(checkTextSimilarity('', 'anything')).toBe(0);
    expect(checkTextSimilarity('one two three', 'two four five')).toBeCloseTo(33.333, 2);
  });

  it('checkTextSimilarity restituisce 0 per input non di parole', () => {
    expect(checkTextSimilarity('!!!', '***')).toBe(0);
  });

  it('wakeUpServer attiva il ping di salute', () => {
    fetchMock.mockResolvedValue({ ok: true });

    wakeUpServer();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/health', {
      method: 'GET',
    });
  });

  it('wakeUpServer gestisce il fallimento del recupero senza lanciare', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error('offline'));

    expect(() => wakeUpServer()).not.toThrow();

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
