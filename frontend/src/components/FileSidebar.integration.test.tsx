import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import FileSidebar from './FileSidebar';
import { useNotesManager } from '../hooks/useNotesManager';

const { dbGetMock, dbSetMock, fileImportMock, fileExportMock } = vi.hoisted(() => ({
  dbGetMock: vi.fn(),
  dbSetMock: vi.fn(),
  fileImportMock: vi.fn(),
  fileExportMock: vi.fn(),
}));

vi.mock('idb-keyval', () => ({
  get: dbGetMock,
  set: dbSetMock,
}));

vi.mock('../services/fileService', () => ({
  fileService: {
    importFile: fileImportMock,
    exportFile: fileExportMock,
  },
}));

function FileSidebarExportHarness() {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    notes,
    activeNoteId,
    setActiveNoteId,
    isLoaded,
    handleCreateNote,
    handleDeleteNote,
    handleRenameNote,
    handleImportNote,
    handleExportNote,
  } = useNotesManager(setSnackbar);

  if (!isLoaded) {
    return <div>Caricamento note...</div>;
  }

  const activeNote = notes.find((note) => note.id === activeNoteId);

  return (
    <>
      <FileSidebar
        notes={notes}
        activeId={activeNoteId}
        onSelect={setActiveNoteId}
        onCreate={handleCreateNote}
        onDelete={handleDeleteNote}
        onRename={handleRenameNote}
        onImport={handleImportNote}
        onExport={handleExportNote}
      />
      <h2>{activeNote?.title}</h2>
      <p>{snackbar.open ? snackbar.message : ''}</p>
    </>
  );
}

describe('FileSidebar integration (export flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbSetMock.mockResolvedValue(undefined);
    fileImportMock.mockResolvedValue(null);
    fileExportMock.mockResolvedValue(undefined);
  });

  it('esporta la nota attiva quando clicco il bottone salva su disco', async () => {
    const user = userEvent.setup();
    dbGetMock.mockResolvedValue([
      { id: 'note-1', title: 'Nota Uno', content: 'Contenuto uno', createdAt: 1 },
    ]);

    render(<FileSidebarExportHarness />);

    await screen.findByRole('heading', { name: 'Nota Uno' });
    await user.click(screen.getByTitle(/salva nota su disco/i));

    await waitFor(() =>
      expect(fileExportMock).toHaveBeenCalledWith('Nota Uno', 'Contenuto uno'),
    );
  });

  it('se cambio nota attiva dalla lista, esporta la nuova nota selezionata', async () => {
    const user = userEvent.setup();
    dbGetMock.mockResolvedValue([
      { id: 'note-1', title: 'Nota Uno', content: 'Contenuto uno', createdAt: 1 },
      { id: 'note-2', title: 'Nota Due', content: 'Contenuto due', createdAt: 2 },
    ]);

    render(<FileSidebarExportHarness />);

    await screen.findByRole('heading', { name: 'Nota Uno' });
    await user.click(screen.getByText('Nota Due'));
    await screen.findByRole('heading', { name: 'Nota Due' });

    await user.click(screen.getByTitle(/salva nota su disco/i));
    await waitFor(() =>
      expect(fileExportMock).toHaveBeenCalledWith('Nota Due', 'Contenuto due'),
    );
  });
});
