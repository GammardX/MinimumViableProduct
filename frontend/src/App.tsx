import { get, set } from 'idb-keyval';
import { useCallback, useEffect, useRef, useState } from 'react';
import DialogLLM from './components/DialogLLM';
import FileSidebar from './components/FileSidebar';
import MarkdownEditor from './components/MarkdownEditor';
import TopBar from './components/TopBar';
import { fileService } from './services/fileService';
import { wakeUpServer } from './services/llmService';
import { Alert, Snackbar, Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';
import './style/main.css';

// --- TIPI ---
export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
}

const WELCOME_NOTE: Note = {
    id: Date.now().toString(),
    title: 'Benvenuto',
    content: `# Benvenuto nel tuo Editor!\n\nQuesta nota è stata creata automaticamente.\n\n## Funzionalità:\n* Le note vengono **salvate automaticamente** nel browser.\n* Puoi usare l'AI per riassumere o tradurre.\n* Usa la sidebar per creare nuovi fogli.`,
    createdAt: Date.now()
};

const DB_KEY = 'my-markdown-notes';

const getPreviewStats = (markdown: string) => {
    if (!markdown) return { words: 0, chars: 0 };
    
    const plainText = markdown
        .replace(/#+\s/g, '') 
        .replace(/(\*\*|__)(.*?)\1/g, '$2') 
        .replace(/(\*|_)(.*?)\1/g, '$2') 
        .replace(/~~(.*?)~~/g, '$1')
        .replace(/!\[.*?\]\(.*?\)/g, '') 
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/`{1,3}([^`]+)`{1,3}/g, '$1') 
        .replace(/^\s*[>\-\*\+]\s+/gm, '') 
        .replace(/^\s*\d+\.\s+/gm, '');

    const chars = plainText.length;
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;

    return { words, chars };
};

export default function App() {
    // --- RISVEGLIO SERVER ---
    useEffect(() => {
    wakeUpServer();
    const intervalId = setInterval(() => {
      wakeUpServer();
    }, 14 * 60 * 1000);

    return () => clearInterval(intervalId);

    }, []);

    // --- STATO DATI ---
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);

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
            } finally {
                setIsLoaded(true);
            }
        }
        loadNotes();
    }, []);

    // --- AUTOSAVE ---
    useEffect(() => {
        if (!isLoaded) return;
        set(DB_KEY, notes).catch((err) =>
            console.error('Errore salvataggio:', err)
        );
    }, [notes, isLoaded]);

    const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

    // --- STATO LAYOUT ---
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const startWidthRef = useRef(0); 

    // --- GESTIONE NOTE ---
    const handleUpdateNote = (newText: string) => {
        setNotes((prev) =>
            prev.map((note) =>
                note.id === activeNoteId ? { ...note, content: newText } : note
            )
        );
    };

    // --- GESTIONE LLM DIALOG ---
    const [editorInstance, setEditorInstance] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [dialogLoading, setDialogLoading] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const llmBridge = {
        currentText: () => {
            let selectedText = '';
            if (editorInstance && editorInstance.codemirror) {
                selectedText = editorInstance.codemirror.getSelection();
            }
            if (!selectedText) {
                selectedText = window.getSelection()?.toString() || '';
            }
            return selectedText.trim() || activeNote?.content || '';
        },

        openLoadingDialog: () => {
            setDialogText('');
            setDialogLoading(true);
            setDialogOpen(true);
        },

        setDialogResult: (text: string) => {
            setDialogLoading(false);
            setDialogText(text);
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
            setDialogText('Generazione annullata dall\'utente.');
        }
    };

    const handleCloseLLMDialog = () => {
        if (dialogLoading) {
            llmBridge.abortCurrent();
        }
        setDialogOpen(false);
    };

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

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

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

    // --- GESTIONE ELIMINAZIONE NOTA ---
    const handleDeleteNote = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNoteToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!noteToDelete) return;

        setNotes((prev) => {
            const newNotes = prev.filter((n) => n.id !== noteToDelete);
            if (activeNoteId === noteToDelete) {
                if (newNotes.length > 0) {
                    setActiveNoteId(newNotes[0].id);
                } else {
                    setActiveNoteId('');
                }
            }
            return newNotes;
        });

        setDeleteDialogOpen(false);
        setNoteToDelete(null);
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
            setNotes(prev => [...prev, newNote]);
            setActiveNoteId(newNote.id);
        }
    };

    const handleExportNote = async (id: string) => {
        const note = notes.find(n => n.id === id);
        if (note) {
            await fileService.exportFile(note.title, note.content);
        }
    };

    // --- LOGICA RESIZING SIDEBAR ---
    const startResizing = useCallback(() => {
        setIsResizing(true);
        startWidthRef.current = sidebarWidth;
    }, [sidebarWidth]);

    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth <= 100) {
                    setSidebarWidth(10);
                } else if (newWidth < 600) {
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    const handleResizerClick = () => {
        if (startWidthRef.current === 10 && sidebarWidth === 10) {
            setSidebarWidth(250);
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // --- NAVIGAZIONE TRA NOTE ---
    const handleNavigate = (target: string, anchor?: string) => {
        const decodedTarget = decodeURIComponent(target);

        let noteToOpen = notes.find((n) => n.id === decodedTarget);

        if (!noteToOpen) {
            noteToOpen = notes.find(
                (n) => n.title.toLowerCase() === decodedTarget.toLowerCase()
            );
        }

        if (noteToOpen) {
            setActiveNoteId(noteToOpen.id);

            if (anchor) {
                setTimeout(() => {
                    const elementId = anchor.toLowerCase().replace(/\s+/g, '');
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 200);
            }
        } else {
            setSnackbar({ 
                open: true, 
                message: `Nota "${decodedTarget}" non trovata!`, 
                severity: 'error' 
            });
        }
    };

    const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCopyInternalLink = () => {
        if (!activeNote) return;
        const linkStr = `[Vai a ${activeNote.title}](#note:${activeNote.id})`;
        navigator.clipboard.writeText(linkStr)
            .then(() => setSnackbar({ 
                open: true, 
                message: "Ancoraggio copiato: ora incollalo in un'altra nota!", 
                severity: 'success' 
            }))
            .catch(err => console.error("Errore nella copia del link:", err));
    };

    const handleCopyLLMText = () => {
        setSnackbar({ 
            open: true, 
            message: "Testo copiato negli appunti!", 
            severity: 'success' 
        });
    };

    const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (!isLoaded) {
        return <div className='loading-screen'>Caricamento note...</div>;
    }

    return (
        <div 
            className={`app-container ${isResizing ? 'is-resizing' : ''}`}
        >
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
                className={`resizer ${(sidebarWidth === 10 || isResizing) ? 'active' : ''}`} 
                onMouseDown={startResizing} 
                onClick={handleResizerClick}
            />

            {/* AREA PRINCIPALE */}
            <div className='main-content'>
                {activeNote ? (
                    <>
                        <TopBar title={activeNote.title} llm={llmBridge} />
                        
                        {/* --- EDITOR MARKDOWN --- */}
                        <div className='editor-wrapper'>
                            <MarkdownEditor
                                key={activeNote.id}
                                initialValue={activeNote.content}
                                onChange={handleUpdateNote}
                                onNavigate={handleNavigate}
                                onInstanceReady={setEditorInstance} 
                            />
                        </div>
                        
                        {/* --- STATUS BAR --- */}
                        <div className="status-bar">
                            <div className="status-left">
                                {getPreviewStats(activeNote.content).words} parole | {getPreviewStats(activeNote.content).chars} caratteri
                            </div>
                            <div 
                                className="status-right" 
                                onClick={handleCopyInternalLink}
                                title="Clicca per copiare il link interno per questa nota"
                            >
                                <span>ID Nota: {activeNote.id}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className='empty-state-container'>
                        <div className='empty-state-card'>
                            <div className='empty-state-icon'>📝</div>
                            <h1>Inizia a scrivere</h1>
                            <p>Non hai selezionato nessuna nota. Crea un nuovo foglio o importane uno esistente per iniziare a lavorare.</p>
                            <div className='empty-state-actions'>
                                <button onClick={handleCreateNote} className='empty-state-primary-btn'>
                                    + Nuova Nota
                                </button>
                                <button onClick={handleImportNote} className='empty-state-secondary-btn'>
                                    📂 Importa File
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* FEEDBACK SNACKBAR UNIFICATA */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                    className="custom-snackbar"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* DIALOG LLM */}
            <DialogLLM
                text={dialogText}
                open={dialogOpen}
                loading={dialogLoading}
                onClose={handleCloseLLMDialog}
                onCancel={llmBridge.abortCurrent} 
                onCopySuccess={handleCopyLLMText}
            />

            {/* DIALOG CONFERMA ELIMINAZIONE */}
            <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
                <DialogTitle>Conferma eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler eliminare questa nota? L'operazione non può essere annullata.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Annulla</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{ color: 'white' }}>
                        Elimina
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}