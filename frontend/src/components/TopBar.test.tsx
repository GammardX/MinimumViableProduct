import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TopBar from './TopBar';
import {
  applySixHats,
  checkTextSimilarity,
  generateText,
  improveWriting,
  summarizeText,
  translate,
} from '../services/llmService.ts';

vi.mock('../style/topbar.css', () => ({}));

vi.mock('@mui/material', () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogActions: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h3>{children}</h3>,
  Menu: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  MenuItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  Slider: ({ value, onChange }: any) => (
    <input
      aria-label='slider'
      type='range'
      value={value}
      onChange={(e) => onChange?.(e, Number((e.target as HTMLInputElement).value))}
    />
  ),
  TextField: ({ value, onChange, placeholder, label, type }: any) => (
    <input
      aria-label={label || placeholder || 'textfield'}
      type={type || 'text'}
      value={value}
      onChange={onChange}
    />
  ),
  Typography: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('../services/llmService.ts', () => ({
  applySixHats: vi.fn(),
  checkTextSimilarity: vi.fn(),
  generateText: vi.fn(),
  improveWriting: vi.fn(),
  summarizeText: vi.fn(),
  translate: vi.fn(),
}));

const mockedGenerateText = vi.mocked(generateText);
const mockedSummarizeText = vi.mocked(summarizeText);
const mockedImproveWriting = vi.mocked(improveWriting);
const mockedTranslate = vi.mocked(translate);
const mockedApplySixHats = vi.mocked(applySixHats);
const mockedSimilarity = vi.mocked(checkTextSimilarity);

const llm = {
  currentText: vi.fn(() => 'base content'),
  hasSelection: vi.fn(() => false),
  getSelectionText: vi.fn(() => 'this is a long selected ai generated paragraph example'),
  openLoadingDialog: vi.fn(),
  setDialogResult: vi.fn(),
  getAbortSignal: vi.fn(() => new AbortController().signal),
};

const okResponse = {
  outcome: { status: 'success', code: 'OK' },
  data: { rewritten_text: 'rewritten' },
};

const aiHistory = [
  { prompt: 'best prompt', generatedText: 'hist1' },
  { prompt: 'other prompt', generatedText: 'hist2' },
];

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSimilarity.mockReturnValue(0);
    llm.hasSelection.mockReturnValue(false);
    llm.getSelectionText.mockReturnValue('this is a long selected ai generated paragraph example');
  });

  it('opens generate dialog with AI warning when similarity is high', async () => {
    const user = userEvent.setup();
    mockedSimilarity.mockImplementationOnce(() => 80).mockImplementation(() => 10);

    render(<TopBar title='Doc' aiHistory={aiHistory} llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Genera/i }));

    expect(screen.getByText(/stai rigenerando un testo creato/i)).toBeInTheDocument();
  });

  it('generate submits prompt and handles success with rewritten text', async () => {
    const user = userEvent.setup();
    mockedSimilarity.mockImplementationOnce(() => 80).mockImplementation(() => 10);
    mockedGenerateText.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' aiHistory={aiHistory} llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Genera/i }));
    await user.click(screen.getByRole('button', { name: /^Genera$/ }));

    await waitFor(() => {
      expect(mockedGenerateText).toHaveBeenCalledWith('best prompt', 'base content', 300, expect.any(AbortSignal));
    });
    expect(llm.openLoadingDialog).toHaveBeenCalled();
    expect(llm.setDialogResult).toHaveBeenCalledWith('rewritten', 'best prompt');
  });

  it('generate uses fallback text when rewritten_text is null', async () => {
    const user = userEvent.setup();
    llm.getSelectionText.mockReturnValue('short');
    mockedGenerateText.mockResolvedValue({
      outcome: { status: 'success', code: 'OK' },
      data: { rewritten_text: null },
    } as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Genera/i }));

    const prompt = screen.getByLabelText(/buchi neri|textfield/i);
    await user.clear(prompt);
    await user.type(prompt, 'new prompt');
    await user.click(screen.getByRole('button', { name: /^Genera$/ }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Nessun testo generato.', 'new prompt');
    });
  });

  it('generate handles non-abort errors', async () => {
    const user = userEvent.setup();
    llm.getSelectionText.mockReturnValue('short');
    mockedGenerateText.mockRejectedValue(new Error('boom'));

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Genera/i }));

    const prompt = screen.getByLabelText(/buchi neri|textfield/i);
    await user.type(prompt, 'again');
    await user.click(screen.getByRole('button', { name: /^Genera$/ }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Errore di connessione o parsing durante la generazione.');
    });
  });

  it('generate keeps default word count when numeric input is NaN and disables empty prompt submit', async () => {
    const user = userEvent.setup();
    llm.getSelectionText.mockReturnValue('short');
    mockedGenerateText.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Genera/i }));

    const generateBtn = screen.getByRole('button', { name: /^Genera$/ });
    expect(generateBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Numero indicativo di parole/i), {
      target: { value: 'abc' },
    });

    const prompt = screen.getByLabelText(/buchi neri|textfield/i);
    await user.type(prompt, 'prompt');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(mockedGenerateText).toHaveBeenCalledWith('prompt', 'base content', 300, expect.any(AbortSignal));
    });
  });

  it('summary chooses insert mode when there is selection', async () => {
    const user = userEvent.setup();
    llm.hasSelection.mockReturnValue(true);
    mockedSummarizeText.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Riassumi/i }));
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => expect(llm.openLoadingDialog).toHaveBeenCalledWith('insert'));
  });

  it('summary uses slider value when applying', async () => {
    const user = userEvent.setup();
    mockedSummarizeText.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Riassumi/i }));
    fireEvent.change(screen.getByLabelText('slider'), { target: { value: '60' } });
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => {
      expect(mockedSummarizeText).toHaveBeenCalledWith('base content', 60, expect.any(AbortSignal));
    });
  });

  it('summary handles INVALID_INPUT response', async () => {
    const user = userEvent.setup();
    mockedSummarizeText.mockResolvedValue({
      outcome: { status: 'INVALID_INPUT', code: 'I1' },
      data: null,
    } as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Riassumi/i }));
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Input non valido. Codice: I1');
    });
  });

  it('summary handles unknown server status', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedSummarizeText.mockResolvedValue({
      outcome: { status: 'other', code: 'X' },
      data: null,
    } as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Riassumi/i }));
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Errore sconosciuto nella risposta del server.');
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it('summary handles non-abort errors', async () => {
    const user = userEvent.setup();
    mockedSummarizeText.mockRejectedValue(new Error('sum fail'));

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Riassumi/i }));
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Errore di connessione o parsing durante la generazione.');
    });
  });

  it('improve handles success response', async () => {
    const user = userEvent.setup();
    mockedImproveWriting.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Migliora/i }));

    const input = screen.getByLabelText(/pi˘ formale|pi√π formale|textfield/i);
    await user.type(input, 'better');
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => expect(llm.setDialogResult).toHaveBeenCalledWith('rewritten', undefined));
  });

  it('improve handles non-abort errors', async () => {
    const user = userEvent.setup();
    mockedImproveWriting.mockRejectedValue(new Error('network'));

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Migliora/i }));

    const input = screen.getByLabelText(/pi˘ formale|pi√π formale|textfield/i);
    await user.type(input, 'formal');
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Errore di connessione o parsing durante la generazione.');
    });
  });

  it('translate handles success response', async () => {
    const user = userEvent.setup();
    mockedTranslate.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Traduci/i }));

    const input = screen.getByLabelText(/inglese|textfield/i);
    await user.type(input, 'German');
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => expect(llm.setDialogResult).toHaveBeenCalledWith('rewritten', undefined));
  });

  it('translate ignores AbortError', async () => {
    const user = userEvent.setup();
    mockedTranslate.mockRejectedValue({ name: 'AbortError' });

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Traduci/i }));

    const input = screen.getByLabelText(/inglese|textfield/i);
    await user.type(input, 'English');
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => expect(mockedTranslate).toHaveBeenCalled());
    expect(llm.setDialogResult).not.toHaveBeenCalledWith('Errore di connessione o parsing durante la generazione.');
  });

  it('translate handles non-abort errors', async () => {
    const user = userEvent.setup();
    mockedTranslate.mockRejectedValue(new Error('translate net'));

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Traduci/i }));

    const input = screen.getByLabelText(/inglese|textfield/i);
    await user.type(input, 'Spanish');
    await user.click(screen.getByRole('button', { name: /Applica/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Errore di connessione o parsing durante la generazione.');
    });
  });

  it('six-hats handles refusal', async () => {
    const user = userEvent.setup();
    mockedApplySixHats.mockResolvedValue({
      outcome: { status: 'refusal', code: 'R1', violation_category: 'Safe' },
      data: null,
    } as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Analisi/i }));
    await user.click(screen.getByRole('button', { name: /Blu: Gestione/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Richiesta rifiutata. Motivo: R1 (Safe).');
    });
  });

  it('six-hats handles non-abort errors', async () => {
    const user = userEvent.setup();
    mockedApplySixHats.mockRejectedValue(new Error('net'));

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Analisi/i }));
    await user.click(screen.getByRole('button', { name: /Rosso: Emozioni/i }));

    await waitFor(() => {
      expect(llm.setDialogResult).toHaveBeenCalledWith('Errore di connessione o parsing durante la generazione.');
    });
  });

  it('analysis menu closes after selecting an hat', async () => {
    const user = userEvent.setup();
    mockedApplySixHats.mockResolvedValue(okResponse as any);

    render(<TopBar title='Doc' llm={llm} />);
    await user.click(screen.getByRole('button', { name: /Analisi/i }));
    await user.click(screen.getByRole('button', { name: /Blu: Gestione/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Blu: Gestione/i })).not.toBeInTheDocument();
    });
  });

  it('cancel buttons close summary, improve and translate dialogs', async () => {
    const user = userEvent.setup();
    render(<TopBar title='Doc' llm={llm} />);

    await user.click(screen.getByRole('button', { name: /Riassumi/i }));
    expect(screen.getByText(/Intensit‡ del riassunto|Intensit√† del riassunto/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Annulla$/i }));
    expect(screen.queryByText(/Intensit‡ del riassunto|Intensit√† del riassunto/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Migliora/i }));
    expect(screen.getByText(/criterio di riscrittura/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Annulla$/i }));
    expect(screen.queryByText(/criterio di riscrittura/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Traduci/i }));
    expect(screen.getByText(/lingua di destinazione/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Annulla$/i }));
    expect(screen.queryByText(/lingua di destinazione/i)).not.toBeInTheDocument();
  });
});
