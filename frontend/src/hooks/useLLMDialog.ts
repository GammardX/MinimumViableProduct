import { useEffect, useRef, useState } from 'react';
import type { Note } from '../types/types';

type DialogActionType =
	| 'insert'
	| 'analysis'
	| 'summary'
	| 'improve'
	| 'translate';

interface UseLLMDialogReturn {
	dialogOpen: boolean;
	dialogText: string;
	dialogLoading: boolean;
	dialogActionType: DialogActionType;
	dialogHasSelection: boolean;
	llmBridge: {
		currentText: () => string;
		getSelectionText: () => string;
		hasSelection: () => boolean;
		openLoadingDialog: (type?: DialogActionType) => void;
		setDialogResult: (text: string, prompt?: string) => void;
		getAbortSignal: () => AbortSignal;
		abortCurrent: () => void;
	};
	handleReplaceText: () => void;
	handleInsertBelowText: () => void;
	handleCreateNewNoteFromResult: () => void;
	handleCloseLLMDialog: () => void;
	handleCopyLLMText: () => void;
}

export function useLLMDialog(
	editorInstance: any,
	activeNote: Note | undefined,
	activeNoteId: string,
	setNotes: React.Dispatch<React.SetStateAction<Note[]>>,
	setSnackbar: React.Dispatch<
		React.SetStateAction<{
			open: boolean;
			message: string;
			severity: 'success' | 'error';
		}>
	>
): UseLLMDialogReturn {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogText, setDialogText] = useState('');
	const [dialogLoading, setDialogLoading] = useState(false);
	const [dialogPrompt, setDialogPrompt] = useState('');
	const [dialogActionType, setDialogActionType] =
		useState<DialogActionType>('insert');
	const [dialogHasSelection, setDialogHasSelection] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Abort on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	const getSelectedText = (): string => {
		let selected = '';
		if (editorInstance && editorInstance.codemirror) {
			selected = editorInstance.codemirror.getSelection();
		}
		if (!selected) {
			selected = window.getSelection()?.toString() || '';
		}
		return selected.trim();
	};

	const llmBridge = {
		currentText: () => getSelectedText() || activeNote?.content || '',
		getSelectionText: () => getSelectedText(),
		hasSelection: () => getSelectedText().length > 0,

		openLoadingDialog: (type: DialogActionType = 'insert') => {
			setDialogActionType(type);
			setDialogText('');
			setDialogLoading(true);
			setDialogOpen(true);
			const isSel = editorInstance?.codemirror
				? editorInstance.codemirror.getSelection().trim().length > 0
				: false;
			setDialogHasSelection(isSel);
		},

		setDialogResult: (text: string, prompt?: string) => {
			setDialogLoading(false);
			setDialogText(text);
			if (prompt) setDialogPrompt(prompt);
		},

		getAbortSignal: () => {
			abortControllerRef.current = new AbortController();
			return abortControllerRef.current.signal;
		},

		abortCurrent: () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			setDialogLoading(false);
			setDialogText("Generazione annullata dall'utente.");
		}
	};

	const finalizeAndSaveHistory = (successMessage: string) => {
		if (dialogPrompt) {
			setNotes((prev) =>
				prev.map((note) => {
					if (note.id === activeNoteId) {
						const history = note.aiHistory || [];
						return {
							...note,
							aiHistory: [
								...history,
								{ prompt: dialogPrompt, generatedText: dialogText }
							]
						};
					}
					return note;
				})
			);
		}
		setDialogOpen(false);
		setSnackbar({ open: true, message: successMessage, severity: 'success' });
	};

	const handleReplaceText = () => {
		if (!editorInstance || !editorInstance.codemirror) return;
		editorInstance.codemirror.replaceSelection(dialogText + '\n\n');
		finalizeAndSaveHistory('Testo sostituito nel documento!');
	};

	const handleInsertBelowText = () => {
		if (!editorInstance || !editorInstance.codemirror) return;
		const cm = editorInstance.codemirror;
		const selections = cm.listSelections();
		if (selections.length > 0) {
			const sel = selections[0];
			const isAnchorBelow =
				sel.anchor.line > sel.head.line ||
				(sel.anchor.line === sel.head.line && sel.anchor.ch > sel.head.ch);
			const endPos = isAnchorBelow ? sel.anchor : sel.head;
			cm.replaceRange('\n\n' + dialogText + '\n\n', endPos);
		} else {
			cm.replaceSelection(dialogText + '\n\n');
		}
		finalizeAndSaveHistory('Testo inserito in coda al capitolo!');
	};

	const handleCreateNewNoteFromResult = () => {
		if (!activeNote) return;
		const prefixMap: Record<DialogActionType, string> = {
			analysis: 'Analisi',
			summary: 'Riassunto',
			improve: 'Miglioramento',
			translate: 'Traduzione',
			insert: 'Analisi'
		};
		const newNote: Note = {
			id: Date.now().toString(),
			title: `${prefixMap[dialogActionType]}: ${activeNote.title}`,
			content: dialogText,
			createdAt: Date.now()
		};
		setNotes((prev) => [...prev, newNote]);
		setDialogOpen(false);
		setSnackbar({
			open: true,
			message: 'Nota creata con successo!',
			severity: 'success'
		});
	};

	const handleCloseLLMDialog = () => {
		if (dialogLoading) llmBridge.abortCurrent();
		setDialogOpen(false);
	};

	const handleCopyLLMText = () => {
		setSnackbar({
			open: true,
			message: 'Testo copiato negli appunti!',
			severity: 'success'
		});
	};

	return {
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
		handleCopyLLMText
	};
}
