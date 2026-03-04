import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DialogLLM from './DialogLLM';

vi.mock('@mui/material/Button', () => ({
  default: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
vi.mock('@mui/material/CircularProgress', () => ({ default: () => <div>spinner</div> }));
vi.mock('@mui/material/Dialog', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@mui/material/DialogActions', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@mui/material/DialogContent', () => ({ default: ({ children, className }: any) => <div className={className}>{children}</div> }));
vi.mock('@mui/material/DialogContentText', () => ({ default: ({ children, className }: any) => <p className={className}>{children}</p> }));
vi.mock('@mui/material/DialogTitle', () => ({ default: ({ children }: any) => <h2>{children}</h2> }));

describe('DialogLLM', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state and cancel button', () => {
    const onCancel = vi.fn();
    render(<DialogLLM text='' open loading onClose={vi.fn()} onCancel={onCancel} />);

    expect(screen.getByText('spinner')).toBeInTheDocument();
    expect(screen.getByText('Annulla')).toBeInTheDocument();
  });

  it('shows fallback text when result is empty', () => {
    render(<DialogLLM text='' open loading={false} onClose={vi.fn()} />);
    expect(screen.getByText('Nessun risultato')).toBeInTheDocument();
  });

  it('calls onReplace when Sostituisci Testo button is clicked', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();

    render(
      <DialogLLM
        text='ok text'
        open
        loading={false}
        actionType='insert'
        hasSelection
        onClose={vi.fn()}
        onReplace={onReplace}
        onInsertBelow={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Sostituisci Testo' }));

    expect(onReplace).toHaveBeenCalledTimes(1);
  });

  it('calls onInsertBelow when Inserisci Sotto button is clicked', async () => {
    const user = userEvent.setup();
    const onInsertBelow = vi.fn();

    render(
      <DialogLLM
        text='ok text'
        open
        loading={false}
        actionType='insert'
        hasSelection
        onClose={vi.fn()}
        onReplace={vi.fn()}
        onInsertBelow={onInsertBelow}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Inserisci Sotto' }));

    expect(onInsertBelow).toHaveBeenCalledTimes(1);
  });

  it('shows create-note button for non-insert actions', async () => {
    const user = userEvent.setup();
    const onCreateNewNote = vi.fn();

    render(
      <DialogLLM
        text='analysis'
        open
        loading={false}
        actionType='analysis'
        onClose={vi.fn()}
        onCreateNewNote={onCreateNewNote}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Salva come nota' }));
    expect(onCreateNewNote).toHaveBeenCalledTimes(1);
  });

  it('calls onCopySuccess when copy succeeds with callback', async () => {
    const user = userEvent.setup();
    const onCopySuccess = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <DialogLLM text='copy me' open loading={false} onClose={vi.fn()} onCopySuccess={onCopySuccess} />
    );

    await user.click(screen.getByRole('button', { name: 'Copia' }));

    expect(onCopySuccess).toHaveBeenCalledTimes(1);
  });

  it('copies text to clipboard when onCopySuccess is not provided', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <DialogLLM text='copy me too' open loading={false} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Copia' }));

    expect(writeText).toHaveBeenCalledWith('copy me too');
  });

  it('does not show copy button for invalid text', () => {
    render(
      <DialogLLM text="Generazione annullata dall'utente." open loading={false} onClose={vi.fn()} />
    );

    expect(screen.queryByRole('button', { name: 'Copia' })).not.toBeInTheDocument();
  });

  it('logs copy errors when clipboard fails', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <DialogLLM text='x' open loading={false} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Copia' }));
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
