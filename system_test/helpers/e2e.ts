import { Buffer } from 'node:buffer';
import { expect, type Locator, type Page } from '@playwright/test';

export async function resetBrowserState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function ensureBackendAwake(page: Page): Promise<void> {
  await page.request.get('http://127.0.0.1:8000/health');
}

export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByText('Le tue note')).toBeVisible();
  await expect(page.locator('.CodeMirror')).toBeVisible();
}

export function editorRoot(page: Page): Locator {
  return page.locator('.CodeMirror').first();
}

export function previewRoot(page: Page): Locator {
  return page.locator('.editor-preview-side').first();
}

export async function setMarkdown(page: Page, markdown: string): Promise<void> {
  await page.evaluate((text) => {
    const cmHost = document.querySelector('.CodeMirror') as any;
    if (!cmHost?.CodeMirror) throw new Error('CodeMirror instance not found');
    cmHost.CodeMirror.setValue(text);
    cmHost.CodeMirror.focus();
  }, markdown);
}

export async function getMarkdown(page: Page): Promise<string> {
  return page.evaluate(() => {
    const cmHost = document.querySelector('.CodeMirror') as any;
    return cmHost?.CodeMirror?.getValue() ?? '';
  });
}

export async function selectText(page: Page, target: string): Promise<void> {
  await page.evaluate((needle) => {
    const cmHost = document.querySelector('.CodeMirror') as any;
    if (!cmHost?.CodeMirror) throw new Error('CodeMirror instance not found');
    const cm = cmHost.CodeMirror;
    const fullText = cm.getValue() as string;
    const start = fullText.indexOf(needle);
    if (start < 0) throw new Error(`Text not found: ${needle}`);
    const end = start + needle.length;

    const toLineCh = (text: string, idx: number) => {
      const before = text.slice(0, idx);
      const parts = before.split('\n');
      return { line: parts.length - 1, ch: parts[parts.length - 1].length };
    };

    cm.focus();
    cm.setSelection(toLineCh(fullText, start), toLineCh(fullText, end));
  }, target);
}

export async function placeCursorAtEnd(page: Page): Promise<void> {
  await page.evaluate(() => {
    const cmHost = document.querySelector('.CodeMirror') as any;
    const cm = cmHost?.CodeMirror;
    if (!cm) throw new Error('CodeMirror instance not found');
    const value: string = cm.getValue();
    const lines = value.split('\n');
    cm.focus();
    cm.setCursor({ line: lines.length - 1, ch: lines.at(-1)?.length ?? 0 });
  });
}

export async function clickToolbar(page: Page, title: string): Promise<void> {
  const map: Record<string, string> = {
    Grassetto: '.editor-toolbar .fa-bold',
    Corsivo: '.editor-toolbar .fa-italic',
    Titolo: '.editor-toolbar .fa-header',
    Codice: '.editor-toolbar .fa-code',
    Citazione: '.editor-toolbar .fa-quote-left',
    'Lista puntata': '.editor-toolbar .fa-list-ul',
    'Lista numerata': '.editor-toolbar .fa-list-ol',
    Tabella: '.editor-toolbar .fa-table',
    'Inserisci Link': '.editor-toolbar .fa-link',
    'Inserisci Immagine': '.editor-toolbar .fa-picture-o',
    Anteprima: '.editor-toolbar .fa-eye',
    'Modalità affiancata': '.editor-toolbar .fa-columns'
  };

  const iconSelector = map[title];
  if (iconSelector) {
    const icon = page.locator(iconSelector).first();
    if (await icon.count()) {
      await icon.locator('xpath=ancestor::*[self::a or self::button][1]').click();
      return;
    }
  }

  await page.locator(`.editor-toolbar [title="${title}"]`).first().click();
}

export async function expectPreviewContains(page: Page, text: string): Promise<void> {
  await expect(previewRoot(page).getByText(text, { exact: false })).toBeVisible();
}

export async function forceLegacyFilePickers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined, configurable: true });
  });
}

export async function importNoteFromFile(page: Page, fileName: string, content: string): Promise<void> {
  const chooserPromise = page.waitForEvent('filechooser');
  await page.locator('.btn-icon[title="Carica da file"]').click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: fileName,
    mimeType: 'text/markdown',
    buffer: Buffer.from(content, 'utf-8')
  });
}

export async function openDeleteDialogForActiveNote(page: Page): Promise<void> {
  await page.locator('li.active .btn-delete').click();
  await expect(page.getByRole('dialog', { name: 'Conferma eliminazione' })).toBeVisible();
}

export async function createNote(page: Page): Promise<void> {
  await page.locator('.btn-add').click();
  await expect(page.getByRole('heading', { name: 'Nuova Nota' })).toBeVisible();
}

export async function renameActiveNote(page: Page, newTitle: string): Promise<void> {
  const activeName = page.locator('li.active .file-name');
  await activeName.dblclick();
  const input = page.locator('li.active .file-rename-input');
  await input.fill(newTitle);
  await input.press('Enter');
  await expect(page.locator('li.active .file-name')).toHaveText(newTitle);
}

export async function sidebarWidth(page: Page): Promise<number> {
  return page.locator('.sidebar-wrapper').evaluate((el) => parseFloat(getComputedStyle(el).width));
}

export async function selectAllInEditor(page: Page): Promise<void> {
  await editorRoot(page).click();
  await page.keyboard.press('ControlOrMeta+a');
}

export async function typeInEditor(page: Page, text: string): Promise<void> {
  await editorRoot(page).click();
  await page.keyboard.type(text);
}

export async function openAnalysisHat(page: Page, hatLabel: string): Promise<void> {
  await page.getByRole('button', { name: /Analisi/i }).click();
  await page.getByRole('menuitem', { name: new RegExp(hatLabel, 'i') }).click();
}

export async function expectStatusCounts(page: Page): Promise<void> {
  await expect(page.locator('.status-left')).toContainText('parole');
  await expect(page.locator('.status-left')).toContainText('caratteri');
}
