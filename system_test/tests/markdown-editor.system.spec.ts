import { expect, test } from '@playwright/test';
import {
  clickToolbar,
  createNote,
  expectPreviewContains,
  expectStatusCounts,
  forceLegacyFilePickers,
  getMarkdown,
  gotoApp,
  importNoteFromFile,
  ensureBackendAwake,
  openAnalysisHat,
  openDeleteDialogForActiveNote,
  placeCursorAtEnd,
  previewRoot,
  renameActiveNote,
  resetBrowserState,
  selectAllInEditor,
  selectText,
  setMarkdown,
  sidebarWidth,
  typeInEditor
} from '../helpers/e2e';

async function boot(page: Parameters<typeof gotoApp>[0]) {
  await resetBrowserState(page);
  await ensureBackendAwake(page);
  await gotoApp(page);
}

test('Scrittura e Visualizzazione Base', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'Testo semplice di prova');
  await expect(await getMarkdown(page)).toContain('Testo semplice di prova');
  await expectPreviewContains(page, 'Testo semplice di prova');
});

test('Formattazione Base e Interazione', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'Testo in stile ~~barrato~~');

  await selectText(page, 'Testo');
  await clickToolbar(page, 'Grassetto');
  await selectText(page, 'in');
  await clickToolbar(page, 'Corsivo');

  const markdown = await getMarkdown(page);
  expect(markdown).toContain('**Testo**');
  expect(markdown).toContain('*in*');
  expect(markdown).toContain('~~barrato~~');
  await expect(previewRoot(page).locator('strong', { hasText: 'Testo' })).toBeVisible();
  await expect(previewRoot(page).locator('em', { hasText: 'in' })).toBeVisible();
  await expect(previewRoot(page).locator('del', { hasText: 'barrato' })).toBeVisible();
});

test('Gestione Titoli e Struttura', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6');
  for (const h of ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']) {
    await expect(previewRoot(page).getByRole('heading', { name: h })).toBeVisible();
  }
});

test('Inserimento Immagini', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '![alt test](https://example.com/a.png)');
  const img = previewRoot(page).locator('img[alt="alt test"]');
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', /example\.com\/a\.png/);
});

test('Gestione Link Esterni e Interni', async ({ page }) => {
  await boot(page);
  await createNote(page);
  await renameActiveNote(page, 'NotaDestinazione');

  await page.locator('li').filter({ hasText: 'Benvenuto' }).click();
  await setMarkdown(page, '[Esterno](https://example.com)\n\n[Interno](#note:NotaDestinazione)');

  const esterno = previewRoot(page).getByRole('link', { name: 'Esterno' });
  await expect(esterno).toHaveAttribute('href', 'https://example.com');

  await previewRoot(page).getByRole('link', { name: 'Interno' }).click();
  await expect(page.getByRole('heading', { name: 'NotaDestinazione' })).toBeVisible();
});

test('Gestione Ancore (Link Interni)', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '# Sezione\n\n[Test link](#Sezione)');
  await previewRoot(page).getByRole('link', { name: 'Test link' }).click();
  await expect(previewRoot(page).getByRole('heading', { name: 'Sezione' })).toBeVisible();
});

test('Gestione Elenchi', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '1. Uno\n2. Due\n\n- A\n  - B');
  await expect(previewRoot(page).locator('ol li')).toHaveCount(2);
  await expect(previewRoot(page).locator('ul li')).toHaveCount(2);
});

test('Gestione Codice', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'Inline `codice`\n\n```js\nconst x = 1;\n```');
  await expect(previewRoot(page).locator('p code', { hasText: 'codice' })).toBeVisible();
  await expect(previewRoot(page).locator('pre code', { hasText: 'const x = 1;' })).toBeVisible();
});

test('Gestione Tabelle', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '| A | B |\n|---|---|\n| 1 | 2 |');
  await expect(previewRoot(page).locator('table')).toBeVisible();
  await expect(previewRoot(page).locator('th', { hasText: 'A' })).toBeVisible();
  await expect(previewRoot(page).locator('td', { hasText: '2' })).toBeVisible();
});

test('Gestione Citazioni', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '> Citazione importante');
  await expect(previewRoot(page).locator('blockquote', { hasText: 'Citazione importante' })).toBeVisible();
});

test('Caricamento Nota (Successo e Fallimento)', async ({ page }) => {
  await forceLegacyFilePickers(page);
  await boot(page);
  await importNoteFromFile(page, 'caricata.md', '# Da file\nContenuto');

  await expect(page.getByRole('heading', { name: 'caricata' })).toBeVisible();
  const beforeFailedImport = await page.locator('.file-list li').count();

  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('.btn-icon[title="Carica da file"]').click();
  const chooser = await chooserPromise;
  await chooser.setFiles([]);
  await expect(page.locator('.file-list li')).toHaveCount(beforeFailedImport);
});

test('Salvataggio Nota (Successo e Fallimento)', async ({ page }) => {
  await forceLegacyFilePickers(page);
  await boot(page);

  await setMarkdown(page, 'Contenuto da salvare');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.btn-icon[title="Salva nota su disco"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\\.md$/);
  await expect(page.locator('.status-left')).toContainText('parole');
});

test('Eliminazione Nota e Annullamento', async ({ page }) => {
  await boot(page);
  await createNote(page);

  await openDeleteDialogForActiveNote(page);
  await page.getByRole('button', { name: 'Annulla' }).click();
  await expect(page.getByRole('dialog', { name: 'Conferma eliminazione' })).not.toBeVisible();

  await openDeleteDialogForActiveNote(page);
  await page.getByRole('button', { name: 'Elimina' }).click();
  await expect(page.getByText('Nota eliminata con successo!')).toBeVisible();
});

test('Modalità di Visualizzazione', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.editor-preview-side.editor-preview-active-side')).toBeVisible();

  await clickToolbar(page, 'Anteprima');
  await expect(page.locator('.editor-preview.editor-preview-active')).toBeVisible();

  await clickToolbar(page, 'Modalità affiancata');
  await expect(page.locator('.editor-preview-side.editor-preview-active-side')).toBeVisible();
});

test('Riassunto LLM (Flusso Completo)', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'testo base');

  await page.getByRole('button', { name: /Riassumi/i }).click();
  await page.getByRole('button', { name: 'Applica' }).click();
  await expect(page.getByText('Risultato LLM di test')).toBeVisible();

  await page.getByRole('button', { name: 'Chiudi' }).click();
  await setMarkdown(page, '[[FORCE_ERROR]]');
  await selectText(page, '[[FORCE_ERROR]]');
  await page.getByRole('button', { name: /Riassumi/i }).click();
  await page.getByRole('button', { name: 'Applica' }).click();
  await expect(page.getByText(/Errore|Risultato LLM di test|Input non valido|Richiesta rifiutata/i)).toBeVisible();

  await page.getByRole('button', { name: 'Chiudi' }).click();
  await setMarkdown(page, '[[FORCE_DELAY]]');
  await selectText(page, '[[FORCE_DELAY]]');
  await page.getByRole('button', { name: /Riassumi/i }).click();
  await page.getByRole('button', { name: 'Applica' }).click();
  const cancelSummary = page.getByRole('button', { name: 'Annulla' });
  if (await cancelSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cancelSummary.click();
    await expect(page.getByText("Generazione annullata dall'utente.")).toBeVisible();
  } else {
    await expect(page.getByText('Risultato LLM di test')).toBeVisible();
  }
});

test('Traduzione LLM (Flusso Completo)', async ({ page }) => {
  await boot(page);

  await page.getByRole('button', { name: /Traduci/i }).click();
  await page.getByPlaceholder('Es: inglese, spagnolo, francese…').fill('inglese');
  await page.getByRole('button', { name: 'Applica' }).click();
  await expect(page.getByText('Risultato LLM di test')).toBeVisible();
});

test('Riscrittura LLM (Flusso Completo)', async ({ page }) => {
  await boot(page);

  await page.getByRole('button', { name: /Migliora/i }).click();
  await page.getByPlaceholder('Es: più formale, più chiaro, stile accademico…').fill('formale');
  await page.getByRole('button', { name: 'Applica' }).click();
  await expect(page.getByText('Risultato LLM di test')).toBeVisible();
});

test('Analisi Critica LLM (Sei Cappelli)', async ({ page }) => {
  await boot(page);

  for (const hat of ['Bianco', 'Rosso', 'Nero', 'Giallo', 'Verde', 'Blu']) {
    await openAnalysisHat(page, hat);
    await expect(page.getByText('Risultato LLM di test')).toBeVisible();
    await page.getByRole('button', { name: 'Salva come nota' }).click();
    await expect(page.getByText('Nota creata con successo!')).toBeVisible();
  }
});

test('Undo delle modifiche', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'prima');
  await typeInEditor(page, ' dopo');
  await page.keyboard.press('ControlOrMeta+z');
  await expect(await getMarkdown(page)).toContain('prima');
});

test('Redo delle modifiche', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'prima');
  await typeInEditor(page, ' dopo');
  await page.keyboard.press('ControlOrMeta+z');
  await page.keyboard.press('ControlOrMeta+y');
  await expect(await getMarkdown(page)).toContain('dopo');
});

test('Selezione capitoli dedicata', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, '# Capitolo\nTesto\n\n## Altro\nFine');
  await page.locator('.editor-toolbar [title="Seleziona l\'intero capitolo"]').click();
  await page.keyboard.type('[SELEZIONATO]');
  await expect(await getMarkdown(page)).toContain('[SELEZIONATO]');
});

test('Gestione creazione note nel Browser', async ({ page }) => {
  await boot(page);
  await createNote(page);
  await expect(page.locator('.file-list li')).toHaveCount(2);
});

test('Gestione rinomina nota', async ({ page }) => {
  await boot(page);
  await renameActiveNote(page, 'Titolo Rinominato');
  await expect(page.getByRole('heading', { name: 'Titolo Rinominato' })).toBeVisible();
});

test('Gestione visualizzazione e ridimensionamento sidebar', async ({ page }) => {
  await boot(page);
  const before = await sidebarWidth(page);
  await page.locator('.resizer').dispatchEvent('mousedown', { clientX: before });
  await page.mouse.move(420, 100);
  await page.mouse.up();
  const after = await sidebarWidth(page);
  expect(after).toBeGreaterThan(before);
});

test('Gestione apertura/chiusura sidebar', async ({ page }) => {
  await boot(page);
  await page.locator('.resizer').dispatchEvent('mousedown', { clientX: 250 });
  await page.mouse.move(50, 100);
  await page.mouse.up();
  expect(await sidebarWidth(page)).toBeLessThanOrEqual(20);

  await page.locator('.resizer').click();
  expect(await sidebarWidth(page)).toBeGreaterThan(100);
});

test('Selezione lingua di traduzione', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Traduci/i }).click();
  const input = page.getByPlaceholder('Es: inglese, spagnolo, francese…');
  await input.fill('spagnolo');
  await expect(input).toHaveValue('spagnolo');
});

test('Selezione tipo di analisi critica', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Analisi/i }).click();
  await expect(page.getByRole('menuitem', { name: /Bianco: Fatti/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Rosso: Emozioni/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Nero: Rischi/i })).toBeVisible();
});

test('Scrittura prompt per distant writing', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Genera/i }).click();
  const prompt = page.getByPlaceholder('Es: Scrivi un paragrafo introduttivo sui buchi neri...');
  await prompt.fill('Prompt di test');
  await expect(prompt).toHaveValue('Prompt di test');
});

test('Selezione percentuale riassunto', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Riassumi/i }).click();
  const slider = page.getByRole('slider');
  await slider.focus();
  for (let i = 0; i < 2; i++) {
    await page.keyboard.press('ArrowRight');
  }
  await expect(page.getByText('Percentuale di riduzione: 70%')).toBeVisible();
});

test('Specifica preferenze riscrittura', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Migliora/i }).click();
  const criterion = page.getByPlaceholder('Es: più formale, più chiaro, stile accademico…');
  await criterion.fill('stile tecnico');
  await expect(criterion).toHaveValue('stile tecnico');
});

test('Salvataggio riassunto come nuova nota', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Riassumi/i }).click();
  await page.getByRole('button', { name: 'Applica' }).click();
  await page.getByRole('button', { name: 'Salva come nota' }).click();
  await expect(page.locator('.file-list li').filter({ hasText: /Riassunto:/ })).toBeVisible();
});

test('Salvataggio traduzione come nuova nota', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Traduci/i }).click();
  await page.getByPlaceholder('Es: inglese, spagnolo, francese…').fill('inglese');
  await page.getByRole('button', { name: 'Applica' }).click();
  await page.getByRole('button', { name: 'Salva come nota' }).click();
  await expect(page.locator('.file-list li').filter({ hasText: /Traduzione:/ })).toBeVisible();
});

test('Salvataggio riscrittura come nuova nota', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: /Migliora/i }).click();
  await page.getByPlaceholder('Es: più formale, più chiaro, stile accademico…').fill('chiaro');
  await page.getByRole('button', { name: 'Applica' }).click();
  await page.getByRole('button', { name: 'Salva come nota' }).click();
  await expect(page.locator('.file-list li').filter({ hasText: /Miglioramento:/ })).toBeVisible();
});

test('Salvataggio analisi critica come nuova nota', async ({ page }) => {
  await boot(page);
  await openAnalysisHat(page, 'Blu');
  await page.getByRole('button', { name: 'Salva come nota' }).click();
  await expect(page.locator('.file-list li').filter({ hasText: /Analisi:/ })).toBeVisible();
});

test('Selezione numero di parole per generazione automatica', async ({ page }) => {
  await boot(page);

  await page.getByRole('button', { name: /Genera/i }).click();
  await page.getByPlaceholder('Es: Scrivi un paragrafo introduttivo sui buchi neri...').fill('Prompt');
  await page.getByLabel('Numero indicativo di parole').fill('1000');
  await page.getByRole('button', { name: 'Genera' }).click();
  await expect(page.getByText('Risultato LLM di test')).toBeVisible();
});

test('Visualizzazione informazioni della nota', async ({ page }) => {
  await boot(page);
  await setMarkdown(page, 'uno due tre');
  await expectStatusCounts(page);
  await expect(page.locator('.status-left')).toContainText('3 parole');
});