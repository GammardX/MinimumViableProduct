import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
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

  it('shows insert buttons with selection and triggers handlers', async () => {
    const user = userEvent.setup();
    const onReplace = vi.fn();
    const onInsertBelow = vi.fn();

    render(
      <DialogLLM
        text='ok text'
        open
        loading={false}
        actionType='insert'
        hasSelection
        onClose={vi.fn()}
        onReplace={onReplace}
        onInsertBelow={onInsertBelow}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Sostituisci Testo' }));
    await user.click(screen.getByRole('button', { name: 'Inserisci Sotto' }));

    expect(onReplace).toHaveBeenCalledTimes(1);
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

  it('copies valid text with and without onCopySuccess', async () => {
    const user = userEvent.setup();
    const onCopySuccess = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { rerender } = render(
      <DialogLLM text='copy me' open loading={false} onClose={vi.fn()} onCopySuccess={onCopySuccess} />
    );

    await user.click(screen.getByRole('button', { name: 'Copia' }));
    expect(onCopySuccess).toHaveBeenCalledTimes(1);

    rerender(<DialogLLM text='copy me too' open loading={false} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Copia' }));

    expect(writeText).toHaveBeenCalledWith('copy me too');
  });

  it('does not copy invalid text and logs copy errors', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { rerender } = render(
      <DialogLLM text="Generazione annullata dall'utente." open loading={false} onClose={vi.fn()} />
    );

    expect(screen.queryByRole('button', { name: 'Copia' })).not.toBeInTheDocument();

    rerender(<DialogLLM text='x' open loading={false} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Copia' }));
    await Promise.resolve();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
