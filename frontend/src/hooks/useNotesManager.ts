import { get, set } from 'idb-keyval';
import { useEffect, useState } from 'react';
import { fileService } from '../services/fileService';
import { DB_KEY, type Note, WELCOME_NOTE } from '../types/types';

interface UseNotesManagerReturn {
	notes: Note[];
	setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
	activeNoteId: string;
	setActiveNoteId: React.Dispatch<React.SetStateAction<string>>;
	activeNote: Note | undefined;
	isLoaded: boolean;
	deleteDialogOpen: boolean;
	handleCreateNote: () => void;
	handleDeleteNote: (id: string, e: React.MouseEvent) => void;
	confirmDelete: () => Promise<void>;
	cancelDelete: () => void;
	handleRenameNote: (id: string, newTitle: string) => void;
	handleImportNote: () => Promise<void>;
	handleExportNote: (id: string) => Promise<void>;
	handleUpdateNote: (newText: string) => void;
	setSnackbar: React.Dispatch<
		React.SetStateAction<{
			open: boolean;
			message: string;
			severity: 'success' | 'error';
		}>
	>;
}

export function useNotesManager(
	setSnackbar: React.Dispatch<
		React.SetStateAction<{
			open: boolean;
			message: string;
			severity: 'success' | 'error';
		}>
	>
): UseNotesManagerReturn {
	const [notes, setNotes] = useState<Note[]>([]);
	const [activeNoteId, setActiveNoteId] = useState<string>('');
	const [isLoaded, setIsLoaded] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

	// --- CARICAMENTO INIZIALE ---
	useEffect(() => {
		async function loadNotes() {
			try {
				const savedNotes = await get<Note[]>(DB_KEY);
				if (savedNotes && savedNotes.length > 0) {
					setNotes(savedNotes);
					setActiveNoteId(savedNotes[0].id);
				} else {
					setNotes([WELCOME_NOTE]);
					setActiveNoteId(WELCOME_NOTE.id);
					await set(DB_KEY, [WELCOME_NOTE]);
				}
			} catch (error) {
				console.error('Errore nel caricamento delle note:', error);
				setNotes([WELCOME_NOTE]);
				setActiveNoteId(WELCOME_NOTE.id);
				setSnackbar({
					open: true,
					message: 'Errore durante il caricamento delle note.',
					severity: 'error'
				});
			} finally {
				setIsLoaded(true);
			}
		}
		loadNotes();
	}, []);

	// --- AUTOSAVE ---
	useEffect(() => {
		if (!isLoaded) return;
		set(DB_KEY, notes).catch((err) => {
			console.error('Errore salvataggio:', err);
			setSnackbar({
				open: true,
				message: 'Errore durante il salvataggio automatico della nota.',
				severity: 'error'
			});
		});
	}, [notes, isLoaded]);

	const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

	const handleUpdateNote = (newText: string) => {
		setNotes((prev) =>
			prev.map((note) =>
				note.id === activeNoteId ? { ...note, content: newText } : note
			)
		);
	};

	const handleCreateNote = () => {
		const newNote: Note = {
			id: Date.now().toString(),
			title: 'Nuova Nota',
			content: '# Titolo\nInizia a scrivere...',
			createdAt: Date.now()
		};
		setNotes((prev) => [...prev, newNote]);
		setActiveNoteId(newNote.id);
	};

	const handleDeleteNote = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setNoteToDelete(id);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = async () => {
		if (!noteToDelete) return;
		const newNotes = notes.filter((n) => n.id !== noteToDelete);
		try {
			await set(DB_KEY, newNotes);
			setNotes(newNotes);
			if (activeNoteId === noteToDelete) {
				setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : '');
			}
			setSnackbar({
				open: true,
				message: 'Nota eliminata con successo!',
				severity: 'success'
			});
		} catch (error) {
			console.error("Errore durante l'eliminazione:", error);
			setSnackbar({
				open: true,
				message: "Errore durante l'eliminazione della nota dal database.",
				severity: 'error'
			});
		} finally {
			setDeleteDialogOpen(false);
			setNoteToDelete(null);
		}
	};

	const cancelDelete = () => {
		setDeleteDialogOpen(false);
		setNoteToDelete(null);
	};

	const handleRenameNote = (id: string, newTitle: string) => {
		setNotes((prevNotes) =>
			prevNotes.map((note) =>
				note.id === id ? { ...note, title: newTitle } : note
			)
		);
	};

	const handleImportNote = async () => {
		const data = await fileService.importFile();
		if (data) {
			const newNote: Note = {
				id: Date.now().toString(),
				title: data.title,
				content: data.content,
				createdAt: Date.now()
			};
			setNotes((prev) => [...prev, newNote]);
			setActiveNoteId(newNote.id);
		}
	};

	const handleExportNote = async (id: string) => {
		const note = notes.find((n) => n.id === id);
		if (note) {
			await fileService.exportFile(note.title, note.content);
		}
	};

	return {
		notes,
		setNotes,
		activeNoteId,
		setActiveNoteId,
		activeNote,
		isLoaded,
		deleteDialogOpen,
		handleCreateNote,
		handleDeleteNote,
		confirmDelete,
		cancelDelete,
		handleRenameNote,
		handleImportNote,
		handleExportNote,
		handleUpdateNote,
		setSnackbar
	};
}
