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

  it('uses editor selection when available', () => {
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

  it('returns active note content when available', () => {
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

  it('returns empty string when no active note', () => {
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

  it('opens loading dialog and sets selection flag', () => {
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

  it('sets dialog result and prompt', () => {
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

  it('aborts current generation', () => {
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

  it('replace handler is a no-op without editor', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.handleReplaceText();
    });

    expect(setSnackbar).not.toHaveBeenCalled();
  });

  it('replaces text and saves history when prompt exists', () => {
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

  it('inserts below selection using replaceRange when selections exist', () => {
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

  it('inserts via replaceSelection when no selections exist', () => {
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

  it('creates a new note from result based on action type', () => {
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

  it('does nothing when creating new note without active note', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, undefined, '', setNotes, setSnackbar)
    );

    act(() => {
      result.current.handleCreateNewNoteFromResult();
    });

    expect(setNotes).not.toHaveBeenCalled();
  });

  it('close handler aborts when loading and copy handler shows snackbar', () => {
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

  it('aborts ongoing request on unmount', () => {
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
  it('exposes getSelectionText and returns note unchanged for non-active ids in history save', () => {
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
  it('insert-below is a no-op without editor instance', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.handleInsertBelowText();
    });

    expect(setSnackbar).not.toHaveBeenCalled();
  });

  it('uses head position when anchor is not below', () => {
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

  it('close handler works when dialog is not loading', () => {
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
  it('abortCurrent works even when no abort signal was created', () => {
    const { result } = renderHook(() =>
      useLLMDialog(null, note, note.id, setNotes, setSnackbar)
    );

    act(() => {
      result.current.llmBridge.abortCurrent();
    });

    expect(result.current.dialogText).toBe("Generazione annullata dall'utente.");
  });

  it('replace saves snackbar without writing history when prompt is missing', () => {
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

  it('uses anchor when selection is on the same line but anchor ch is greater', () => {
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

