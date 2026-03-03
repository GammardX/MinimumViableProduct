import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from './App';
import { wakeUpServer } from './services/llmService';
import { getPreviewStats } from './hooks/useWordsCounter';
import { useLLMDialog } from './hooks/useLLMDialog';
import { useNavigation } from './hooks/useNavigation';
import { useNotesManager } from './hooks/useNotesManager';
import { useSidebarResize } from './hooks/useSidebarResize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./style/main.css', () => ({}));

vi.mock('@mui/material', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  Snackbar: ({
    open,
    children,
    onClose,
  }: {
    open: boolean;
    children: React.ReactNode;
    onClose?: (_event?: React.SyntheticEvent | Event, reason?: string) => void;
  }) => (
    <div data-testid='snackbar' data-open={open ? 'true' : 'false'}>
      {children}
      <button onClick={() => onClose?.(undefined, 'clickaway')}>Snackbar Clickaway</button>
      <button onClick={() => onClose?.()}>Snackbar Close</button>
    </div>
  ),
  Typography: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

vi.mock('./components/DialogLLM', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>Dialog LLM</div> : null),
}));

vi.mock('./components/FileSidebar', () => ({
  default: ({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) => (
    <div>
      <button onClick={onCreate}>Create From Sidebar</button>
      <button onClick={onImport}>Import From Sidebar</button>
    </div>
  ),
}));

vi.mock('./components/MarkdownEditor', () => ({
  default: ({ initialValue }: { initialValue: string }) => <div>Editor: {initialValue}</div>,
}));

vi.mock('./components/TopBar', () => ({
  default: ({ title }: { title: string }) => <div>TopBar: {title}</div>,
}));

vi.mock('./services/llmService', () => ({
  wakeUpServer: vi.fn(),
}));

vi.mock('./hooks/useWordsCounter', () => ({
  getPreviewStats: vi.fn(),
}));

vi.mock('./hooks/useNotesManager', () => ({
  useNotesManager: vi.fn(),
}));

vi.mock('./hooks/useSidebarResize', () => ({
  useSidebarResize: vi.fn(),
}));

vi.mock('./hooks/useLLMDialog', () => ({
  useLLMDialog: vi.fn(),
}));

vi.mock('./hooks/useNavigation', () => ({
  useNavigation: vi.fn(),
}));

const mockedUseNotesManager = vi.mocked(useNotesManager);
const mockedUseSidebarResize = vi.mocked(useSidebarResize);
const mockedUseLLMDialog = vi.mocked(useLLMDialog);
const mockedUseNavigation = vi.mocked(useNavigation);
const mockedGetPreviewStats = vi.mocked(getPreviewStats);
const mockedWakeUpServer = vi.mocked(wakeUpServer);

const baseNote = {
  id: 'note-1',
  title: 'Nota test',
  content: 'Contenuto nota',
  createdAt: 1,
  aiHistory: [],
};

const createBaseline = () => {
  const handleCreateNote = vi.fn();
  const handleImportNote = vi.fn();

  return {
    notesManager: {
      notes: [baseNote],
      setNotes: vi.fn(),
      activeNoteId: baseNote.id,
      setActiveNoteId: vi.fn(),
      activeNote: baseNote,
      isLoaded: true,
      deleteDialogOpen: false,
      handleCreateNote,
      handleDeleteNote: vi.fn(),
      confirmDelete: vi.fn(),
      cancelDelete: vi.fn(),
      handleRenameNote: vi.fn(),
      handleImportNote,
      handleExportNote: vi.fn(),
      handleUpdateNote: vi.fn(),
      setSnackbar: vi.fn(),
    },
    sidebarResize: {
      sidebarWidth: 250,
      isResizing: false,
      sidebarRef: { current: null },
      startResizing: vi.fn(),
      handleResizerClick: vi.fn(),
    },
    llmDialog: {
      dialogOpen: false,
      dialogText: '',
      dialogLoading: false,
      dialogActionType: 'insert' as const,
      dialogHasSelection: false,
      llmBridge: {
        currentText: vi.fn(() => ''),
        getSelectionText: vi.fn(() => ''),
        hasSelection: vi.fn(() => false),
        openLoadingDialog: vi.fn(),
        setDialogResult: vi.fn(),
        getAbortSignal: vi.fn(() => new AbortController().signal),
        abortCurrent: vi.fn(),
      },
      handleReplaceText: vi.fn(),
      handleInsertBelowText: vi.fn(),
      handleCreateNewNoteFromResult: vi.fn(),
      handleCloseLLMDialog: vi.fn(),
      handleCopyLLMText: vi.fn(),
    },
    navigation: {
      handleNavigate: vi.fn(),
      handleCopyInternalLink: vi.fn(),
    },
    handlers: { handleCreateNote, handleImportNote },
  };
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValue(baseline.notesManager);
    mockedUseSidebarResize.mockReturnValue(baseline.sidebarResize);
    mockedUseLLMDialog.mockReturnValue(baseline.llmDialog);
    mockedUseNavigation.mockReturnValue(baseline.navigation);
    mockedGetPreviewStats.mockReturnValue({ words: 3, chars: 14 });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // UNIT TESTS
  it('shows loading screen when notes are not loaded', () => {
    const baseline = createBaseline();
    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      isLoaded: false,
    });

    render(<App />);

    expect(screen.getByText('Caricamento note...')).toBeInTheDocument();
  });

  it('renders active note content and status info', () => {
    render(<App />);

    expect(screen.getByText('TopBar: Nota test')).toBeInTheDocument();
    expect(screen.getByText('Editor: Contenuto nota')).toBeInTheDocument();
    expect(screen.getByText('3 parole | 14 caratteri')).toBeInTheDocument();
    expect(screen.getByText('ID Nota: note-1')).toBeInTheDocument();
  });

  it('renders empty state and triggers handlers', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      activeNote: undefined,
      handleCreateNote: baseline.handlers.handleCreateNote,
      handleImportNote: baseline.handlers.handleImportNote,
    });

    render(<App />);

    expect(screen.getByText('Inizia a scrivere')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ Nuova Nota' }));
    await user.click(screen.getByRole('button', { name: '📂 Importa File' }));

    expect(baseline.handlers.handleCreateNote).toHaveBeenCalledTimes(1);
    expect(baseline.handlers.handleImportNote).toHaveBeenCalledTimes(1);
  });

  it('calls wakeUpServer on mount and interval', () => {
    vi.useFakeTimers();

    render(<App />);

    expect(mockedWakeUpServer).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(mockedWakeUpServer).toHaveBeenCalledTimes(2);
  });

  it('adds active class to resizer when sidebar is collapsed', () => {
    const baseline = createBaseline();
    mockedUseSidebarResize.mockReturnValueOnce({
      ...baseline.sidebarResize,
      sidebarWidth: 10,
    });

    render(<App />);

    const resizer = document.querySelector('.resizer');
    expect(resizer).toHaveClass('active');
  });

  it('adds is-resizing class when sidebar drag is active', () => {
    const baseline = createBaseline();
    mockedUseSidebarResize.mockReturnValueOnce({
      ...baseline.sidebarResize,
      isResizing: true,
    });

    render(<App />);

    const appContainer = document.querySelector('.app-container');
    expect(appContainer).toHaveClass('is-resizing');
  });

  it('ignores snackbar clickaway close reason', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Snackbar Clickaway' }));

    expect(screen.getByText('TopBar: Nota test')).toBeInTheDocument();
  });

  it('handles snackbar normal close', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Snackbar Close' }));

    expect(screen.getByText('TopBar: Nota test')).toBeInTheDocument();
  });
});