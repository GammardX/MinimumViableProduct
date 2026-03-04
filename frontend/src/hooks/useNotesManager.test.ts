import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import { fileService } from '../services/fileService';
import { DB_KEY } from '../types/types';
import { useNotesManager } from './useNotesManager';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock('../services/fileService', () => ({
  fileService: {
    importFile: vi.fn(),
    exportFile: vi.fn(),
  },
}));

const mockedGet = vi.mocked(get);
const mockedSet = vi.mocked(set);
const mockedFileService = vi.mocked(fileService);

describe('useNotesManager', () => {
  const setSnackbar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    mockedSet.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads saved notes and sets active note', async () => {
    const saved = [
      { id: 'a1', title: 'A', content: 'A content', createdAt: 1 },
      { id: 'a2', title: 'B', content: 'B content', createdAt: 2 },
    ];
    mockedGet.mockResolvedValue(saved);

    const { result } = renderHook(() => useNotesManager(setSnackbar));

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.notes).toEqual(saved);
    expect(result.current.activeNoteId).toBe('a1');
  });

  it('initializes welcome note when storage is empty', async () => {
    mockedGet.mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotesManager(setSnackbar));

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.notes.length).toBe(1);
    expect(result.current.activeNoteId).toBe(result.current.notes[0].id);
    expect(mockedSet).toHaveBeenCalledWith(DB_KEY, expect.any(Array));
  });

  it('shows snackbar when load fails', async () => {
    mockedGet.mockRejectedValue(new Error('db down'));

    const { result } = renderHook(() => useNotesManager(setSnackbar));

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Errore durante il caricamento delle note.',
      severity: 'error',
    });
  });

  it('logs an error to console on load failure', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGet.mockRejectedValue(new Error('db down'));

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(errSpy).toHaveBeenCalledTimes(1);
  });

  it('shows snackbar on autosave failure', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 't', createdAt: 1 }]);
    mockedSet.mockRejectedValueOnce(new Error('save failed'));

    renderHook(() => useNotesManager(setSnackbar));

    await waitFor(() => {
      expect(setSnackbar).toHaveBeenCalledWith({
        open: true,
        message: 'Errore durante il salvataggio automatico della nota.',
        severity: 'error',
      });
    });
  });

  it('creates a new note and makes it active', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'old', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.handleCreateNote();
    });

    expect(result.current.notes).toHaveLength(2);
    expect(result.current.activeNoteId).toBe('1000');
  });

  it('updates note content correctly', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'old', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.setActiveNoteId('x');
      result.current.handleUpdateNote('new text');
    });

    const updated = result.current.notes.find((n) => n.id === 'x');
    expect(updated?.content).toBe('new text');
  });

  it('renames a note after creation', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'old', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.handleCreateNote();
      result.current.handleRenameNote('1000', 'Renamed');
    });

    const created = result.current.notes.find((n) => n.id === '1000');
    expect(created?.title).toBe('Renamed');
  });

  it('opens delete dialog and prevents propagation', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'old', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    const stopPropagation = vi.fn();
    act(() => {
      result.current.handleDeleteNote('x', { stopPropagation } as unknown as React.MouseEvent);
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(result.current.deleteDialogOpen).toBe(true);
  });

  it('cancels delete dialog when requested', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'old', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.handleDeleteNote('x', { stopPropagation: vi.fn() } as unknown as React.MouseEvent);
    });

    act(() => {
      result.current.cancelDelete();
    });

    expect(result.current.deleteDialogOpen).toBe(false);
  });

  it('confirmDelete returns early when no note is selected', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'old', createdAt: 1 }]);
    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(setSnackbar).not.toHaveBeenCalled();
  });

  it('deletes note successfully and updates active note', async () => {
    mockedGet.mockResolvedValue([
      { id: 'x', title: 'X', content: 'x', createdAt: 1 },
      { id: 'y', title: 'Y', content: 'y', createdAt: 2 },
    ]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.handleDeleteNote('x', { stopPropagation: vi.fn() } as unknown as React.MouseEvent);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.activeNoteId).toBe('y');
    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Nota eliminata con successo!',
      severity: 'success',
    });
  });

  it('handles delete errors', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'x', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    mockedSet.mockRejectedValueOnce(new Error('delete failed'));

    act(() => {
      result.current.handleDeleteNote('x', { stopPropagation: vi.fn() } as unknown as React.MouseEvent);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: "Errore durante l'eliminazione della nota dal database.",
      severity: 'error',
    });
    expect(result.current.deleteDialogOpen).toBe(false);
    expect(errSpy).toHaveBeenCalledTimes(1);
  });

  it('imports notes when file service returns data', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'x', createdAt: 1 }]);
    mockedFileService.importFile.mockResolvedValue({
      title: 'Imported',
      content: 'from file',
    });

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.handleImportNote();
    });

    expect(result.current.notes).toHaveLength(2);
    expect(result.current.activeNoteId).toBe('1000');
  });

  it('does nothing on import when service returns null', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'x', createdAt: 1 }]);
    mockedFileService.importFile.mockResolvedValue(null);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.handleImportNote();
    });

    expect(result.current.notes).toHaveLength(1);
  });

  it('exports existing note and skips unknown id', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'x', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.handleExportNote('x');
      await result.current.handleExportNote('missing');
    });

    expect(mockedFileService.exportFile).toHaveBeenCalledTimes(1);
    expect(mockedFileService.exportFile).toHaveBeenCalledWith('X', 'x');
  });

  it('clears active id when deleting the last active note', async () => {
    mockedGet.mockResolvedValue([{ id: 'x', title: 'X', content: 'x', createdAt: 1 }]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    act(() => {
      result.current.handleDeleteNote('x', { stopPropagation: vi.fn() } as any);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.notes).toHaveLength(0);
    expect(result.current.activeNoteId).toBe('');
  });

  it('keeps active id when deleting a non-active note', async () => {
    mockedGet.mockResolvedValue([
      { id: 'x', title: 'X', content: 'x', createdAt: 1 },
      { id: 'y', title: 'Y', content: 'y', createdAt: 2 },
    ]);

    const { result } = renderHook(() => useNotesManager(setSnackbar));
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.activeNoteId).toBe('x');

    act(() => {
      result.current.handleDeleteNote('y', { stopPropagation: vi.fn() } as any);
    });

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.activeNoteId).toBe('x');
  });
});