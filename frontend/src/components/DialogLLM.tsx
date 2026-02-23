import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface DialogLLMProps {
    text: string;
    open: boolean;
    loading: boolean;
    actionType?: 'insert' | 'analysis' | 'summary'; 
    onClose: () => void;
    onCancel?: () => void;
    onCopySuccess?: () => void;
    onInsert?: () => void;
    onCreateNewNote?: () => void;
}

export default function DialogLLM({
    text,
    open,
    loading,
    actionType = 'insert',
    onClose,
    onCancel,
    onCopySuccess,
    onInsert,
    onCreateNewNote 
}: DialogLLMProps) {
    const isInvalidResult = 
        text === "Generazione annullata dall'utente." || 
        text.startsWith("Errore") || 
        text.startsWith("Richiesta rifiutata") || 
        text.startsWith("Input non valido") ||
        text === "Nessun testo generato.";

    const handleCopy = () => {
        if (!text || isInvalidResult) return; 
        navigator.clipboard.writeText(text)
            .then(() => {
                if (onCopySuccess) onCopySuccess();
            })
            .catch(err => {
                console.error("Errore durante la copia:", err);
            });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Risultato LLM</DialogTitle>

            <DialogContent 
                dividers 
                className={`dialog-content-custom ${loading ? 'is-loading' : ''}`}
            >
                {loading ? (
                    <div className="dialog-loading-box"> 
                        <CircularProgress size={24} />
                        <DialogContentText className="dialog-loading-text">
                            LLM sta generando la risposta…
                        </DialogContentText>
                    </div>
                ) : (
                    <DialogContentText className="dialog-text-pre"> 
                        {text || 'Nessun risultato'}
                    </DialogContentText>
                )}
            </DialogContent>

            <DialogActions>
                {loading ? (
                    <Button onClick={onCancel} color="error">
                        Annulla
                    </Button>
                ) : (
                    <>
                        {!isInvalidResult && actionType === 'insert' && onInsert && (
                            <Button onClick={onInsert} variant="contained" disabled={!text}>
                                Inserisci
                            </Button>
                        )}
                        
                        {!isInvalidResult && (actionType === 'analysis' || actionType === 'summary') && onCreateNewNote && (
                            <Button onClick={onCreateNewNote} variant="contained" disabled={!text}>
                                Salva come nota
                            </Button>
                        )}

                        {!isInvalidResult && (
                            <Button onClick={handleCopy} disabled={!text}>
                                Copia
                            </Button>
                        )}
                        <Button onClick={onClose}>
                            Chiudi
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}