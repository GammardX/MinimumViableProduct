import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Snackbar,
	Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import DialogLLM from './components/DialogLLM';
import FileSidebar from './components/FileSidebar';
import MarkdownEditor from './components/MarkdownEditor';
import TopBar from './components/TopBar';
import { wakeUpServer } from './services/llmService';
import './style/main.css';

import { useLLMDialog } from './hooks/useLLMDialog';
import { useNavigation } from './hooks/useNavigation';
import { useNotesManager } from './hooks/useNotesManager';
import { useSidebarResize } from './hooks/useSidebarResize';
import { getPreviewStats } from './hooks/useWordsCounter';

export default function App() {
	// --- STATO SNACKBAR (condiviso tra hooks) ---
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error';
	}>({
		open: false,
		message: '',
		severity: 'success'
	});

	const handleCloseSnackbar = (
		_event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === 'clickaway') return;
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	// --- RISVEGLIO SERVER ---
	useEffect(() => {
		wakeUpServer();
		const intervalId = setInterval(() => wakeUpServer(), 14 * 60 * 1000);
		return () => clearInterval(intervalId);
	}, []);

	// --- GESTIONE NOTE ---
	const {
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
		handleUpdateNote
	} = useNotesManager(setSnackbar);

	// --- RESIZING SIDEBAR ---
	const {
		sidebarWidth,
		isResizing,
		sidebarRef,
		startResizing,
		handleResizerClick
	} = useSidebarResize();

	// --- EDITOR INSTANCE ---
	const [editorInstance, setEditorInstance] = useState<any>(null);

	// --- DIALOG LLM ---
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
		handleCopyLLMText
	} = useLLMDialog(
		editorInstance,
		activeNote,
		activeNoteId,
		setNotes,
		setSnackbar
	);

	// --- NAVIGAZIONE ---
	const { handleNavigate, handleCopyInternalLink } = useNavigation(
		notes,
		activeNote,
		setActiveNoteId,
		setSnackbar
	);

	if (!isLoaded) {
		return <div className='loading-screen'>Caricamento note...</div>;
	}

	return (
		<div className={`app-container ${isResizing ? 'is-resizing' : ''}`}>
			{/* SIDEBAR SINISTRA */}
			<div
				className='sidebar-wrapper'
				style={{ width: sidebarWidth }}
				ref={sidebarRef}>
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
			</div>

			{/* MANIGLIA DI RIDIMENSIONAMENTO */}
			<div
				className={`resizer ${sidebarWidth === 10 || isResizing ? 'active' : ''}`}
				onMouseDown={startResizing}
				onClick={handleResizerClick}
			/>

			{/* AREA PRINCIPALE */}
			<div className='main-content'>
				{activeNote ? (
					<>
						<TopBar
							title={activeNote.title}
							llm={llmBridge}
							aiHistory={activeNote.aiHistory}
						/>

						<div className='editor-wrapper'>
							<MarkdownEditor
								key={activeNote.id}
								initialValue={activeNote.content}
								onChange={handleUpdateNote}
								onNavigate={handleNavigate}
								onInstanceReady={setEditorInstance}
							/>
						</div>

						{/* STATUS BAR */}
						<div className='status-bar'>
							<div className='status-left'>
								{getPreviewStats(activeNote.content).words} parole |{' '}
								{getPreviewStats(activeNote.content).chars} caratteri
							</div>
							<div
								className='status-right'
								onClick={handleCopyInternalLink}
								title='Clicca per copiare il link interno per questa nota'>
								<span>ID Nota: {activeNote.id}</span>
							</div>
						</div>
					</>
				) : (
					<div className='empty-state-container'>
						<div className='empty-state-card'>
							<div className='empty-state-icon'>📝</div>
							<h1>Inizia a scrivere</h1>
							<p>
								Non hai selezionato nessuna nota. Crea un nuovo foglio o
								importane uno esistente per iniziare a lavorare.
							</p>
							<div className='empty-state-actions'>
								<button
									onClick={handleCreateNote}
									className='empty-state-primary-btn'>
									+ Nuova Nota
								</button>
								<button
									onClick={handleImportNote}
									className='empty-state-secondary-btn'>
									📂 Importa File
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* FEEDBACK SNACKBAR */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
					className='custom-snackbar'>
					{snackbar.message}
				</Alert>
			</Snackbar>

			{/* DIALOG LLM */}
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

			{/* DIALOG CONFERMA ELIMINAZIONE */}
			<Dialog open={deleteDialogOpen} onClose={cancelDelete}>
				<DialogTitle>Conferma eliminazione</DialogTitle>
				<DialogContent>
					<Typography>
						Sei sicuro di voler eliminare questa nota? L'operazione non può
						essere annullata.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={cancelDelete}>Annulla</Button>
					<Button
						onClick={confirmDelete}
						color='error'
						variant='contained'
						sx={{ color: 'white' }}>
						Elimina
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
