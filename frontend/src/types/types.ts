// --- TIPI E COSTANTI GLOBALI ---

export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    aiHistory?: Array<{ prompt: string; generatedText: string }>;
}

export const WELCOME_NOTE: Note = {
    id: Date.now().toString(),
    title: 'Benvenuto',
    content: `# Benvenuto nel tuo Editor!\n\nQuesta nota è stata creata automaticamente.\n\n## Funzionalità:\n* Le note vengono **salvate automaticamente** nel browser.\n* Puoi usare l'AI per riassumere o tradurre.\n* Usa la sidebar per creare nuovi fogli.`,
    createdAt: Date.now()
};

export const DB_KEY = 'my-markdown-notes';
