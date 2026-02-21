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
}

export default function DialogLLM({
	text,
	open,
	loading,
	onClose
}: DialogLLMProps) {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>Risultato LLM</DialogTitle>

			<DialogContent dividers>
                {loading ? (
                    <div className="dialog-loading-container"> 
                        <CircularProgress size={22} />
                        <DialogContentText>
                            LLM sta generando la risposta…
                        </DialogContentText>
                    </div>
                ) : (
                    <DialogContentText className="dialog-text-pre" sx={{ color: 'text.primary' }}> 
                        {text || 'Nessun risultato'}
                    </DialogContentText>
                )}
            </DialogContent>

			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					Chiudi
				</Button>
			</DialogActions>
		</Dialog>
	);
}