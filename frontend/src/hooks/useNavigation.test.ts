import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigation } from './useNavigation';

const notes = [
  { id: '1', title: 'Alpha', content: 'a', createdAt: 1 },
  { id: '2', title: 'Beta Note', content: 'b', createdAt: 2 },
];

describe('useNavigation', () => {
  const setActiveNoteId = vi.fn();
  const setSnackbar = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates by note id', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('2');
    });

    expect(setActiveNoteId).toHaveBeenCalledWith('2');
  });

  it('navigates by note title when url-encoded (case-insensitive)', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('beta%20note');
    });

    expect(setActiveNoteId).toHaveBeenCalledWith('2');
  });

  it('navigates by unencoded note title with spaces (case-insensitive)', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('BETA note');
    });

    expect(setActiveNoteId).toHaveBeenCalledWith('2');
  });

  it('navigates by uppercase plain title', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('ALPHA');
    });

    expect(setActiveNoteId).toHaveBeenCalledWith('1');
  });

  it('fails when plus sign is present (not treated as space)', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('beta+note');
    });

    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Nota "beta+note" non trovata!',
      severity: 'error',
    });
  });

  it('shows error when decoded target contains extra whitespace', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('1%20'); // decodes to "1 " which doesn't match id
    });

    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Nota "1 " non trovata!',
      severity: 'error',
    });
  });

  it('scrolls to anchor when provided', () => {
    const scrollIntoView = vi.fn();
    const getByIdSpy = vi
      .spyOn(document, 'getElementById')
      .mockReturnValue({ scrollIntoView } as unknown as HTMLElement);

    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('1', 'My Section');
      vi.advanceTimersByTime(200);
    });

    expect(getByIdSpy).toHaveBeenCalledWith('mysection');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('shows error snackbar when target note is not found', () => {
    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('missing-note');
    });

    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: 'Nota "missing-note" non trovata!',
      severity: 'error',
    });
  });

  it('copies internal link and shows success snackbar', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    await act(async () => {
      result.current.handleCopyInternalLink();
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('[Vai a Alpha](#note:1)');
    expect(setSnackbar).toHaveBeenCalledWith({
      open: true,
      message: "Ancoraggio copiato: ora incollalo in un'altra nota!",
      severity: 'success',
    });
  });

  it('does nothing when copying link with no active note', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() =>
      useNavigation(notes, undefined, setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleCopyInternalLink();
    });

    expect(writeText).not.toHaveBeenCalled();
  });

  it('logs clipboard errors', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    await act(async () => {
      result.current.handleCopyInternalLink();
      await Promise.resolve();
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('does not scroll when anchor element is missing', () => {
    const getByIdSpy = vi.spyOn(document, 'getElementById').mockReturnValue(null);

    const { result } = renderHook(() =>
      useNavigation(notes, notes[0], setActiveNoteId, setSnackbar)
    );

    act(() => {
      result.current.handleNavigate('1', 'No Element');
      vi.advanceTimersByTime(200);
    });

    expect(getByIdSpy).toHaveBeenCalledWith('noelement');
  });
});

