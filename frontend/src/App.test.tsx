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
  it('mostra la schermata di caricamento quando le note non vengono caricate', () => {
    const baseline = createBaseline();
    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      isLoaded: false,
    });

    render(<App />);

    expect(screen.getByText('Caricamento note...')).toBeInTheDocument();
  });

  it('renderizza il contenuto della nota attiva e le informazioni di stato', () => {
    render(<App />);

    expect(screen.getByText('TopBar: Nota test')).toBeInTheDocument();
    expect(screen.getByText('Editor: Contenuto nota')).toBeInTheDocument();
    expect(screen.getByText('3 parole | 14 caratteri')).toBeInTheDocument();
    expect(screen.getByText('ID Nota: note-1')).toBeInTheDocument();
  });

  it('renderizza lo stato vuoto e attiva il handler di creazione della nota', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      activeNote: undefined,
      handleCreateNote: baseline.handlers.handleCreateNote,
    });

    render(<App />);

    expect(screen.getByText('Inizia a scrivere')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ Nuova Nota' }));

    expect(baseline.handlers.handleCreateNote).toHaveBeenCalledTimes(1);
  });

  it('renderizza lo stato vuoto e attiva il handler di importazione della nota', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      activeNote: undefined,
      handleImportNote: baseline.handlers.handleImportNote,
    });

    render(<App />);

    expect(screen.getByText('Inizia a scrivere')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '📂 Importa File' }));

    expect(baseline.handlers.handleImportNote).toHaveBeenCalledTimes(1);
  });

  it('mostra la finestra di dialogo di conferma dell\'eliminazione con il messaggio corretto', () => {
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      deleteDialogOpen: true,
    });

    render(<App />);

    expect(screen.getByText('Conferma eliminazione')).toBeInTheDocument();
    expect(screen.getByText(/Sei sicuro di voler eliminare questa nota/)).toBeInTheDocument();
  });

  it('chiama cancelDelete quando il pulsante Annulla viene cliccato', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      deleteDialogOpen: true,
      cancelDelete: baseline.notesManager.cancelDelete,
    });

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Annulla' }));

    expect(baseline.notesManager.cancelDelete).toHaveBeenCalledTimes(1);
  });

  it('chiama confirmDelete quando il pulsante Elimina viene cliccato', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      deleteDialogOpen: true,
      confirmDelete: baseline.notesManager.confirmDelete,
    });

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Elimina' }));

    expect(baseline.notesManager.confirmDelete).toHaveBeenCalledTimes(1);
  });

  it('chiama wakeUpServer al montaggio e all\'intervallo', () => {
    vi.useFakeTimers();

    render(<App />);

    expect(mockedWakeUpServer).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(mockedWakeUpServer).toHaveBeenCalledTimes(2);
  });

  it('aggiunge la classe attiva al ridimensionatore quando la barra laterale è compressa', () => {
    const baseline = createBaseline();
    mockedUseSidebarResize.mockReturnValueOnce({
      ...baseline.sidebarResize,
      sidebarWidth: 10,
    });

    render(<App />);

    const resizer = document.querySelector('.resizer');
    expect(resizer).toHaveClass('active');
  });

  it('aggiunge la classe is-resizing quando il trascinamento della barra laterale è attivo', () => {
    const baseline = createBaseline();
    mockedUseSidebarResize.mockReturnValueOnce({
      ...baseline.sidebarResize,
      isResizing: true,
    });

    render(<App />);

    const appContainer = document.querySelector('.app-container');
    expect(appContainer).toHaveClass('is-resizing');
  });

  it('ignora la ragione di chiusura del clickaway della snackbar', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Snackbar Clickaway' }));

    expect(screen.getByText('TopBar: Nota test')).toBeInTheDocument();
  });

  it('gestisce la chiusura normale della snackbar', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Snackbar Close' }));

    expect(screen.getByText('TopBar: Nota test')).toBeInTheDocument();
  });

  it('chiama handleCopyInternalLink quando si clicca l\'ID della nota', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseNavigation.mockReturnValueOnce({
      ...baseline.navigation,
      handleCopyInternalLink: baseline.navigation.handleCopyInternalLink,
    });

    render(<App />);

    await user.click(screen.getByText('ID Nota: note-1'));

    expect(baseline.navigation.handleCopyInternalLink).toHaveBeenCalledTimes(1);
  });

  it('chiama handleResizerClick quando il ridimensionatore viene cliccato', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseSidebarResize.mockReturnValueOnce({
      ...baseline.sidebarResize,
      handleResizerClick: baseline.sidebarResize.handleResizerClick,
    });

    render(<App />);

    const resizer = document.querySelector('.resizer');
    await user.click(resizer!);

    expect(baseline.sidebarResize.handleResizerClick).toHaveBeenCalledTimes(1);
  });

  it('chiama startResizing quando il ridimensionatore viene trascinato', async () => {
    const user = userEvent.setup();
    const baseline = createBaseline();

    mockedUseSidebarResize.mockReturnValueOnce({
      ...baseline.sidebarResize,
      startResizing: baseline.sidebarResize.startResizing,
    });

    render(<App />);

    const resizer = document.querySelector('.resizer');
    await user.pointer({ keys: '[MouseLeft>]', target: resizer! });

    expect(baseline.sidebarResize.startResizing).toHaveBeenCalled();
  });

  it('aggiorna l\'editor quando la nota attiva cambia', () => {
    const baseline = createBaseline();
    const anotherNote = {
      id: 'note-2',
      title: 'Altra nota',
      content: 'Nuovo contenuto',
      createdAt: 2,
      aiHistory: [],
    };

    mockedUseNotesManager.mockReturnValueOnce({
      ...baseline.notesManager,
      activeNote: anotherNote,
    });

    render(<App />);

    expect(screen.getByText('Editor: Nuovo contenuto')).toBeInTheDocument();
    expect(screen.getByText('TopBar: Altra nota')).toBeInTheDocument();
  });

  it('non renderizza la snackbar quando è chiusa', () => {
    render(<App />);

    const snackbar = screen.getByTestId('snackbar');
    expect(snackbar).toHaveAttribute('data-open', 'false');
  });
});