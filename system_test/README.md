# System Tests (Playwright)

Suite E2E per i requisiti `T-XX-S` del markdown editor.

## Struttura
- `system_test/tests/markdown-editor.system.spec.ts`: scenari end-to-end.
- `system_test/helpers/e2e.ts`: helper condivisi per editor, sidebar e file I/O (interazioni utente/browser).
- `system_test/mock-llm-provider.cjs`: provider LLM simulato esterno.
- `playwright.config.ts`: avvio provider LLM esterno + backend + frontend.

## Esecuzione
1. Installa dipendenze:
```bash
npm install
cd frontend && npm install && cd ..
npx playwright install
```
2. Esegui i test dalla root:
```bash
npx playwright test
```

## Nota
- Nessun `page.route` sui servizi backend `/llm/*`.
- Le chiamate passano da frontend -> backend -> adapter LLM HTTP.
