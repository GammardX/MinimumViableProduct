/* =======================
 * Tipi condivisi
 * ======================= */

export interface LLMOutcome {
	status: 'success' | 'refusal' | 'INVALID_INPUT';
	code: string;
	violation_category?: string | null;
}

export interface LLMData {
	rewritten_text: string | null;
	detected_language?: string;
}

export interface LLMResponse {
	outcome: LLMOutcome;
	data: LLMData | null;
}

/* =======================
 * Configurazione API backend
 * ======================= */

const BACKEND_BASE_URL =
	import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/* =======================
 * Helper HTTP
 * ======================= */

async function post<T>(endpoint: string, body: unknown, signal?: AbortSignal): Promise<T> {
	const res = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body),
        signal 
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Backend error ${res.status}: ${text}`);
	}

	return res.json();
}

/* =======================
 * Servizi LLM
 * ======================= */

/**
 * Riassume il testo di una percentuale target
 */
export async function summarizeText(
	text: string,
	percentage: number = 30,
	signal?: AbortSignal
): Promise<LLMResponse> {
	return post<LLMResponse>('/llm/summarize', {
		text,
		percentage
	}, signal);
}

/**
 * Migliora la scrittura secondo un criterio
 */
export async function improveWriting(
	text: string,
	criterion: string = 'chiarezza e stile professionale',
	signal?: AbortSignal
): Promise<LLMResponse> {
	return post<LLMResponse>('/llm/improve', {
		text,
		criterion
	}, signal);
}

/**
 * Traduce il testo in una lingua target
 */
export async function translate(
	text: string,
	targetLanguage: string,
	signal?: AbortSignal
): Promise<LLMResponse> {
	return post<LLMResponse>('/llm/translate', {
		text,
		targetLanguage
	}, signal);
}

/**
 * Applica il metodo dei Sei Cappelli
 */
export async function applySixHats(
	text: string,
	hat: 'Bianco' | 'Rosso' | 'Nero' | 'Giallo' | 'Verde' | 'Blu',
	signal?: AbortSignal
): Promise<LLMResponse> {
	return post<LLMResponse>('/llm/six-hats', {
		text,
		hat
	}, signal);
}

/*
Accende il server con una richiesta di salute. 
Non aspetta la risposta, serve solo a svegliarlo se è in sleep mode
*/

export function wakeUpServer(): void {
    fetch(`${BACKEND_BASE_URL}/health`, { 
        method: 'GET' 
    }).catch(() => {
        console.log("Tentativo di wake-up inviato (potrebbe fallire se offline, ma sveglia il server)");
    });
}
