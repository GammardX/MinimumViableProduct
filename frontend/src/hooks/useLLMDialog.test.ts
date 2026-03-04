import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLLMDialog } from './useLLMDialog';
import type { Note } from '../types/types';

const note: Note = {
  id: 'n1',
  title: 'Base',
  content: 'original content',
  createdAt: 1,
  aiHistory: [],
};

describe('useLLMDialog', () => {
  const setNotes = vi.fn();
  const setSnackbar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1234);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('utilizza la selezione dell\'editor quando disponibile', () => {
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ' selected '),
        replaceSelection: vi.fn(),
        listSelections: vi.fn(() => []),
        replaceRange: vi.fn(),
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    expect(result.current.llmBridge.currentText()).toBe('selected');
    expect(result.current.llmBridge.hasSelection()).toBe(true);
  });

  it('restituisce il contenuto della nota attiva quando disponibile', () => {
    const selectionSpy = vi
      .spyOn(window, 'getSelection')
      .mockReturnValue({ toString: () => '' } as Selection);

    const { result } = renderHook<
      ReturnType<typeof useLLMDialog>,
      { activeNote?: typeof note }
    >(
      ({ activeNote }) =>
        useLLMDialog(null, activeNote, activeNote?.id ?? '', setNotes, setSnackbar),
      { initialProps: { activeNote: note } }
    );

    expect(result.current.llmBridge.currentText()).toBe('original content');

    selectionSpy.mockRestore();
  });

  it('restituisce una stringa vuota quando non c\'è una nota attiva', () => {
    const selectionSpy = vi
      .spyOn(window, 'getSelection')
      .mockReturnValue({ toString: () => '' } as Selection);

    const { result, rerender } = renderHook<
      ReturnType<typeof useLLMDialog>,
      { activeNote?: typeof note }
    >(
      ({ activeNote }) =>
        useLLMDialog(null, activeNote, activeNote?.id ?? '', setNotes, setSnackbar),
      { initialProps: { activeNote: note } }
    );

    rerender({ activeNote: undefined });
    expect(result.current.llmBridge.currentText()).toBe('');

    selectionSpy.mockRestore();
  });

  it('apre la finestra di caricamento e imposta il flag di selezione', () => {
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => 'abc'),
        replaceSelection: vi.fn(),
        listSelections: vi.fn(() => []),
        replaceRange: vi.fn(),
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.openLoadingDialog('summary');
    });

    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.dialogLoading).toBe(true);
    expect(result.current.dialogActionType).toBe('summary');
    expect(result.current.dialogHasSelection).toBe(true);
  });

  it('imposta il risultato della finestra e il prompt', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.openLoadingDialog();
    });
    act(() => {
      result.current.llmBridge.setDialogResult('new text', 'prompt x');
    });

    expect(result.current.dialogLoading).toBe(false);
    expect(result.current.dialogText).toBe('new text');
  });

  it('interrompe la generazione attuale', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    let signal: AbortSignal;
    act(() => {
      signal = result.current.llmBridge.getAbortSignal();
      result.current.llmBridge.openLoadingDialog();
    });
    act(() => {
      result.current.llmBridge.abortCurrent();
    });

    expect(signal!.aborted).toBe(true);
    expect(result.current.dialogLoading).toBe(false);
    expect(result.current.dialogText).toBe("Generazione annullata dall'utente.");
  });

  it('il handler di sostituzione è un\'operazione no-op senza editor', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.handleReplaceText();
    });

    expect(setSnackbar).not.toHaveBeenCalled();
  });

  it('sostituisce il testo e salva la cronologia quando il prompt esiste', () => {
    const replaceSelection = vi.fn();
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ''),
        replaceSelection,
        listSelections: vi.fn(() => []),
        replaceRange: vi.fn(),
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.setDialogResult('result body', 'my prompt');
    });
    act(() => {
      result.current.handleReplaceText();
    });

    expect(replaceSelection).toHaveBeenCalledWith('result body\n\n');
    expect(setNotes).toHaveBeenCalledTimes(1);

    const updater = setNotes.mock.calls[0][0] as (prev: typeof note[]) => typeof note[];
    const updated = updater([note]);
    expect(updated[0].aiHistory).toEqual([
      { prompt: 'my prompt', generatedText: 'result body' },
    ]);

    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Testo sostituito nel documento!',
      severity: 'success',
    });
  });

  it('inserisce sotto la selezione usando replaceRange quando le selezioni esistono', () => {
    const replaceRange = vi.fn();
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ''),
        replaceSelection: vi.fn(),
        listSelections: vi.fn(() => [
          {
            anchor: { line: 2, ch: 3 },
            head: { line: 1, ch: 1 },
          },
        ]),
        replaceRange,
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.setDialogResult('appendix', 'prompt');
    });
    act(() => {
      result.current.handleInsertBelowText();
    });

    expect(replaceRange).toHaveBeenCalledWith('\n\nappendix\n\n', {
      line: 2,
      ch: 3,
    });
  });

  it('inserisce tramite replaceSelection quando non ci sono selezioni', () => {
    const replaceSelection = vi.fn();
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ''),
        replaceSelection,
        listSelections: vi.fn(() => []),
        replaceRange: vi.fn(),
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.setDialogResult('inline', 'prompt');
    });
    act(() => {
      result.current.handleInsertBelowText();
    });

    expect(replaceSelection).toHaveBeenCalledWith('inline\n\n');
  });

  it('crea una nuova nota dal risultato in base al tipo di azione', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.openLoadingDialog('translate');
    });
    act(() => {
      result.current.llmBridge.setDialogResult('tradotto');
    });
    act(() => {
      result.current.handleCreateNewNoteFromResult();
    });

    const updater = setNotes.mock.calls[0][0] as (prev: typeof note[]) => typeof note[];
    const out = updater([note]);

    expect(out[1].id).toBe('1234');
    expect(out[1].title).toBe('Traduzione: Base');
    expect(out[1].content).toBe('tradotto');
  });

  it('non fa nulla quando crea una nuova nota senza una nota attiva', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, undefined, '', setNotes, setSnackbar)
    );

    act(() => {
      result.current.handleCreateNewNoteFromResult();
    });

    expect(setNotes).not.toHaveBeenCalled();
  });

  it('il handler di chiusura interrompe durante il caricamento e il handler di copia mostra la snackbar', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.getAbortSignal();
      result.current.llmBridge.openLoadingDialog();
    });
    act(() => {
      result.current.handleCloseLLMDialog();
      result.current.handleCopyLLMText();
    });

    expect(result.current.dialogOpen).toBe(false);
    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Testo copiato negli appunti!',
      severity: 'success',
    });
  });

  it('interrompe la richiesta in corso al momento dello smontaggio', () => {
    const { result, unmount } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    let signal: AbortSignal;
    act(() => {
      signal = result.current.llmBridge.getAbortSignal();
    });

    unmount();

    expect(signal!.aborted).toBe(true);
  });
  it('espone getSelectionText e restituisce la nota invariata per id non attivi nel salvataggio della cronologia', () => {
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => 'picked'),
        replaceSelection: vi.fn(),
        listSelections: vi.fn(() => []),
        replaceRange: vi.fn(),
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    expect(result.current.llmBridge.getSelectionText()).toBe('picked');

    act(() => {
      result.current.llmBridge.setDialogResult('body', 'prompt');
    });
    act(() => {
      result.current.handleReplaceText();
    });

    const other = { id: 'other', title: 'Other', content: 'c', createdAt: 2 };
    const updater = setNotes.mock.calls[0][0] as (prev: Array<typeof note | typeof other>) => Array<typeof note | typeof other>;
    const updated = updater([note, other]);

    expect(updated[1]).toEqual(other);
  });
  it('l\'inserimento-sotto è un\'operazione no-op senza un\'istanza dell\'editor', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.handleInsertBelowText();
    });

    expect(setSnackbar).not.toHaveBeenCalled();
  });

  it('utilizza la posizione head quando l\'anchor non è sotto', () => {
    const replaceRange = vi.fn();
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ''),
        replaceSelection: vi.fn(),
        listSelections: vi.fn(() => [
          {
            anchor: { line: 1, ch: 1 },
            head: { line: 2, ch: 3 },
          },
        ]),
        replaceRange,
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.setDialogResult('tail', 'prompt');
    });
    act(() => {
      result.current.handleInsertBelowText();
    });

    expect(replaceRange).toHaveBeenCalledWith('\n\ntail\n\n', { line: 2, ch: 3 });
  });

  it('il handler di chiusura funziona quando la finestra non è in caricamento', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.openLoadingDialog();
    });
    act(() => {
      result.current.llmBridge.setDialogResult('done');
    });
    act(() => {
      result.current.handleCloseLLMDialog();
    });

    expect(result.current.dialogOpen).toBe(false);
  });
  it('abortCurrent funziona anche quando nessun segnale di interruzione è stato creato', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.abortCurrent();
    });

    expect(result.current.dialogText).toBe("Generazione annullata dall'utente.");
  });

  it('la sostituzione salva la snackbar senza scrivere la cronologia quando il prompt è mancante', () => {
    const replaceSelection = vi.fn();
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ''),
        replaceSelection,
        listSelections: vi.fn(() => []),
        replaceRange: vi.fn(),
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.setDialogResult('no prompt text');
    });
    act(() => {
      result.current.handleReplaceText();
    });

    expect(replaceSelection).toHaveBeenCalledWith('no prompt text\n\n');
    expect(setNotes).not.toHaveBeenCalled();
  });

  it('utilizza l\'anchor quando la selezione è sulla stessa riga ma ch dell\'anchor è maggiore', () => {
    const replaceRange = vi.fn();
    const editorInstance = {
      codemirror: {
        getSelection: vi.fn(() => ''),
        replaceSelection: vi.fn(),
        listSelections: vi.fn(() => [
          {
            anchor: { line: 3, ch: 5 },
            head: { line: 3, ch: 1 },
          },
        ]),
        replaceRange,
      },
    };

    const { result } = renderHook(() =>
      useLLMDialog(editorInstance, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.setDialogResult('same-line', 'prompt');
    });
    act(() => {
      result.current.handleInsertBelowText();
    });

    expect(replaceRange).toHaveBeenCalledWith('\n\nsame-line\n\n', { line: 3, ch: 5 });
  });
});

