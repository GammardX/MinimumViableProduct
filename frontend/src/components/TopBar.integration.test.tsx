import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMemo, useState } from 'react';

import DialogLLM from './DialogLLM';
import TopBar from './TopBar';
import { useLLMDialog } from '../hooks/useLLMDialog';
import type { Note } from '../types/types';

const replaceSelectionMock = vi.fn();
const replaceRangeMock = vi.fn();
const listSelectionsMock = vi.fn(() => [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 10 } }]);

function okResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}

function IntegrationHarness({ selectionText = 'testo selezionato' }: { selectionText?: string }) {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 'note-1',
      title: 'Nota Uno',
      content: 'Contesto nota da riassumere',
      createdAt: 1,
      aiHistory: [],
    },
  ]);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const activeNote = notes[0];

  // Minimal editor bridge so replace/insert handlers have a real target.
  const editorInstance = useMemo(
    () => ({
      codemirror: {
        getSelection: () => selectionText,
        replaceSelection: replaceSelectionMock,
        listSelections: listSelectionsMock,
        replaceRange: replaceRangeMock,
      },
    }),
    [selectionText],
  );

  const {
    dialogOpen,
    dialogText,
    dialogLoading,
    dialogActionType,
    dialogHasSelection,
    llmBridge,
    handleReplaceText,
    handleInsertBelowText,
    handleCreateNewNoteFromResult,
    handleCloseLLMDialog,
    handleCopyLLMText,
  } = useLLMDialog(editorInstance, activeNote, activeNote.id, setNotes, setSnackbar);

  return (
    <>
      <TopBar title={activeNote.title} llm={llmBridge} aiHistory={activeNote.aiHistory} />
      <DialogLLM
        text={dialogText}
        open={dialogOpen}
        loading={dialogLoading}
        actionType={dialogActionType}
        hasSelection={dialogHasSelection}
        onClose={handleCloseLLMDialog}
        onCancel={llmBridge.abortCurrent}
        onCopySuccess={handleCopyLLMText}
        onReplace={handleReplaceText}
        onInsertBelow={handleInsertBelowText}
        onCreateNewNote={handleCreateNewNoteFromResult}
      />
      <ul aria-label='notes-list'>
        {notes.map((note) => (
          <li key={note.id}>{note.title}</li>
        ))}
      </ul>
      <p>{snackbar.open ? snackbar.message : ''}</p>
    </>
  );
}

describe('TopBar integration (real UI flow)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    replaceSelectionMock.mockReset();
    replaceRangeMock.mockReset();
    listSelectionsMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('click su "Riassumi" genera un risultato e permette di sostituire il testo corrente', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      okResponse({
        outcome: { status: 'success', code: 'OK', violation_category: null },
        data: { rewritten_text: 'Riassunto finale', detected_language: 'it' },
      }),
    );

    render(<IntegrationHarness />);

    await user.click(screen.getByRole('button', { name: /riassumi/i }));
    await user.click(screen.getByRole('button', { name: /^applica$/i }));

    await screen.findByText('Riassunto finale');
    await user.click(screen.getByRole('button', { name: /sostituisci testo/i }));
    await waitFor(() => expect(replaceSelectionMock).toHaveBeenCalledWith('Riassunto finale\n\n'));
    await screen.findByText(/testo sostituito nel documento/i);
    await waitForElementToBeRemoved(() =>
      screen.queryByRole('dialog', { name: /risultato llm/i }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/llm/summarize',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('click su "Genera" poi "Annulla" interrompe la richiesta e mostra lo stato nel dialog', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith('/llm/generate')) {
        const signal = init?.signal as AbortSignal | undefined;
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        });
      }
      return Promise.resolve(okResponse({}));
    });

    render(<IntegrationHarness />);

    await user.click(screen.getByRole('button', { name: /genera/i }));
    await user.type(
      screen.getByPlaceholderText(/scrivi un paragrafo introduttivo sui buchi neri/i),
      'Scrivi una intro',
    );

    await user.click(screen.getByRole('button', { name: /^genera$/i }));
    await user.click(screen.getByRole('button', { name: /^annulla$/i }));

    await waitFor(() =>
      expect(screen.getByText("Generazione annullata dall'utente.")).toBeInTheDocument(),
    );
  });
});
