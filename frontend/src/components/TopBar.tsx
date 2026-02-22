import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Menu,
    MenuItem,
    Slider,
    TextField,
    Typography,
    Alert 
} from '@mui/material';
import { useState } from 'react';
import {
    applySixHats,
    improveWriting,
    summarizeText,
    translate,
    generateText,
    checkTextSimilarity,
    type LLMResponse
} from '../services/llmService.ts';
import '../style/topbar.css';

interface TopBarProps {
    title: string;
    aiHistory?: Array<{ prompt: string; generatedText: string }>; 
    llm: {
        currentText: () => string;
        openLoadingDialog: () => void;
        setDialogResult: (t: string, prompt?: string) => void; 
        getAbortSignal: () => AbortSignal; 
    };
}

type HatId = 'Bianco' | 'Rosso' | 'Nero' | 'Giallo' | 'Verde' | 'Blu';

export default function TopBar({ title, aiHistory, llm }: TopBarProps) {
    
    const handleLLMResponse = (result: LLMResponse, usedPrompt?: string) => {
        const { outcome, data } = result;

        if (outcome.status === 'success') {
            llm.setDialogResult(data?.rewritten_text || 'Nessun testo generato.', usedPrompt);
        } else if (outcome.status === 'refusal') {
            llm.setDialogResult(
                `Richiesta rifiutata. Motivo: ${outcome.code} (${outcome.violation_category || 'Generico'}).`
            );
        } else if (outcome.status === 'INVALID_INPUT') {
            llm.setDialogResult(`Input non valido. Codice: ${outcome.code}`);
        } else {
            llm.setDialogResult('Errore sconosciuto nella risposta del server.');
            console.error(outcome);
        }
    };

    /*
        ------------------------------------
        DISTANT WRITING (GENERA TESTO)
        ------------------------------------
    */
    const [openGenerate, setOpenGenerate] = useState(false);
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [isEditingAI, setIsEditingAI] = useState(false);

    const handleGenerateClick = () => {
        const text = llm.currentText();
        let bestMatch = '';
        let maxSim = 0;

        if (aiHistory && aiHistory.length > 0 && text.trim()) {
            for (const history of aiHistory) {
                const sim = checkTextSimilarity(text, history.generatedText);
                if (sim > maxSim) {
                    maxSim = sim;
                    bestMatch = history.prompt;
                }
            }
        }

        if (maxSim > 60) {
            setGeneratePrompt(bestMatch); 
            setIsEditingAI(true);      
        } else {
            setGeneratePrompt('');
            setIsEditingAI(false);
        }

        setOpenGenerate(true);
    };

    const handleConfirmGenerate = async () => {
        setOpenGenerate(false);
        llm.openLoadingDialog();

        try {
            const signal = llm.getAbortSignal();
            const result = await generateText(generatePrompt, signal);
            handleLLMResponse(result, generatePrompt); 
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                llm.setDialogResult('Errore di connessione o parsing durante la generazione.');
            }
        }
    };

    /*
        ------------------------------------
        SUMMARY
        ------------------------------------
    */
    const [openSummary, setOpenSummary] = useState(false);
    const [summaryPercentage, setSummaryPercentage] = useState<number>(50);

    const handleSummarizeClick = () => setOpenSummary(true);

    const handleConfirmSummarize = async () => {
        setOpenSummary(false);
        llm.openLoadingDialog();
        try {
            const signal = llm.getAbortSignal();
            const result = await summarizeText(llm.currentText(), summaryPercentage, signal);
            handleLLMResponse(result);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                llm.setDialogResult('Errore di connessione o parsing durante la generazione.');
            }
        }
    };

    /*
        ------------------------------------
        ENHANCEMENT
        ------------------------------------
    */
    const [openCriterion, setOpenCriterion] = useState(false);
    const [criterion, setCriterion] = useState('');

    const handleImproveClick = () => {
        setCriterion('');
        setOpenCriterion(true);
    };

    const handleConfirmImprove = async () => {
        setOpenCriterion(false);
        llm.openLoadingDialog();
        try {
            const signal = llm.getAbortSignal();
            const result = await improveWriting(llm.currentText(), criterion, signal);
            handleLLMResponse(result);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                llm.setDialogResult('Errore di connessione o parsing durante la generazione.');
            }
        }
    };

    /*
        ------------------------------------
        TRANSLATION
        ------------------------------------
    */
    const [openTargetLanguage, setOpenTargetLanguage] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState('');

    const handleTranslate = () => {
        setTargetLanguage('');
        setOpenTargetLanguage(true);
    };

    const handleConfirmTranslate = async () => {
        setOpenTargetLanguage(false);
        llm.openLoadingDialog();
        try {
            const signal = llm.getAbortSignal();
            const result = await translate(llm.currentText(), targetLanguage, signal);
            handleLLMResponse(result);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                llm.setDialogResult('Errore di connessione o parsing durante la generazione.');
            }
        }
    };

    /*
        ------------------------------------
        SIX HATS
        ------------------------------------
    */
    const sixHats: Array<{ id: HatId; label: string; color: string; }> = [
        { id: 'Bianco', label: 'Bianco: Fatti', color: '#ffffff' }, 
        { id: 'Rosso', label: 'Rosso: Emozioni', color: '#ff0000' },
        { id: 'Nero', label: 'Nero: Rischi', color: '#000000' },
        { id: 'Giallo', label: 'Giallo: Benefici', color: '#ffeb3b' },
        { id: 'Verde', label: 'Verde: Creatività', color: '#4caf50' },
        { id: 'Blu', label: 'Blu: Gestione', color: '#2196f3' }
    ];

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const handleMenuClose = () => setAnchorEl(null);

    return (
        <>
            <header className='top-bar'>
                <div className='file-info'>
                    <h2>{title}</h2>
                </div>
                <div className='actions'>
                    <button onClick={handleGenerateClick}>✒️ Genera</button>
                    <button onClick={handleSummarizeClick}>📋 Riassumi</button>
                    <button onClick={handleImproveClick}>🛠️ Migliora</button>
                    <button onClick={handleTranslate}>🔄 Traduci</button>
                    <button onClick={(e) => setAnchorEl(e.currentTarget as HTMLElement)}>
                        🧢 Analisi
                    </button>
                </div>
                <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                    {sixHats.map((hat) => (
                        <MenuItem
                            key={hat.id} 
                            onClick={async () => {
                                handleMenuClose();
                                llm.openLoadingDialog();
                                try {
                                    const signal = llm.getAbortSignal();
                                    const result = await applySixHats(llm.currentText(), hat.id, signal);
                                    handleLLMResponse(result);
                                } catch (error: any) {
                                    if (error.name !== 'AbortError') {
                                        llm.setDialogResult('Errore di connessione o parsing durante la generazione.');
                                    }
                                }
                            }}>
                            <span
                                className={`hat-color-dot ${hat.id === 'Bianco' ? 'hat-border-white' : ''}`}
                                style={{ backgroundColor: hat.color }}></span>
                            {hat.label}
                        </MenuItem>
                    ))}
                </Menu>
            </header>

            {/* --- DIALOG GENERA --- */}
            <Dialog open={openGenerate} onClose={() => setOpenGenerate(false)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {isEditingAI ? 'Modifica testo generato' : 'Cosa vuoi scrivere?'}
                </DialogTitle>
                <DialogContent sx={{ mt: 1 }}>
                    {isEditingAI && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Attenzione: stai rigenerando un testo creato dall'IA. Le tue modifiche manuali su questa sezione andranno perse.
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder='Es: Scrivi un paragrafo introduttivo sui buchi neri...'
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenGenerate(false)}>Annulla</Button>
                    <Button onClick={handleConfirmGenerate} disabled={!generatePrompt.trim()} variant="contained">
                        Genera
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- DIALOG RIASSUMI --- */}
            <Dialog open={openSummary} onClose={() => setOpenSummary(false)}>
                <DialogTitle>Intensità del riassunto</DialogTitle>
                <DialogContent sx={{ minWidth: 300, mt: 1 }}>
                    <Typography gutterBottom>
                        Percentuale di riduzione: {summaryPercentage}%
                    </Typography>
                    <Slider
                        value={summaryPercentage}
                        onChange={(_, newValue) => setSummaryPercentage(newValue as number)}
                        step={10} min={10} max={90} valueLabelDisplay='auto'
                    />
                    <Typography variant='caption' color='text.secondary'>
                        (10% = riassunto leggero, 90% = molto sintetico)
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSummary(false)}>Annulla</Button>
                    <Button onClick={handleConfirmSummarize}>Applica</Button>
                </DialogActions>
            </Dialog>

            {/* --- DIALOG MIGLIORA --- */}
            <Dialog open={openCriterion} onClose={() => setOpenCriterion(false)}>
                <DialogTitle>Decidi il criterio di riscrittura</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus fullWidth multiline minRows={3}
                        placeholder='Es: più formale, più chiaro, stile accademico…'
                        value={criterion}
                        onChange={(e) => setCriterion(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCriterion(false)}>Annulla</Button>
                    <Button onClick={handleConfirmImprove} disabled={!criterion.trim()}>Applica</Button>
                </DialogActions>
            </Dialog>

            {/* --- DIALOG TRADUCI --- */}
            <Dialog open={openTargetLanguage} onClose={() => setOpenTargetLanguage(false)}>
                <DialogTitle>Decidi la lingua di destinazione</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus fullWidth multiline minRows={3}
                        placeholder='Es: inglese, spagnolo, francese…'
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTargetLanguage(false)}>Annulla</Button>
                    <Button onClick={handleConfirmTranslate} disabled={!targetLanguage.trim()}>Applica</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}