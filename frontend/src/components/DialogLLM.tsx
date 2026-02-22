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
    onClose: () => void;
    onCancel?: () => void; 
}

export default function DialogLLM({
    text,
    open,
    loading,
    onClose,
    onCancel 
}: DialogLLMProps) {
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
                    <Button onClick={onClose}>
                        Chiudi
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}