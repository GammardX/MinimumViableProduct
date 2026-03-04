import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fileService } from './fileService';

describe('fileService', () => {
  const originalOpenPicker = window.showOpenFilePicker;
  const originalSavePicker = window.showSaveFilePicker;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    window.showOpenFilePicker = undefined;
    window.showSaveFilePicker = undefined;
  });

  afterEach(() => {
    window.showOpenFilePicker = originalOpenPicker;
    window.showSaveFilePicker = originalSavePicker;
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('imports with modern file picker API', async () => {
    window.showOpenFilePicker = vi.fn().mockResolvedValue([
      {
        getFile: vi.fn().mockResolvedValue({
          name: 'note.md',
          text: vi.fn().mockResolvedValue('hello from file'),
        }),
      },
    ]);

    const result = await fileService.importFile();

    expect(result).toEqual({ title: 'note', content: 'hello from file' });
  });

  it('returns null when modern import is aborted', async () => {
    window.showOpenFilePicker = vi
      .fn()
      .mockRejectedValue({ name: 'AbortError' });

    const result = await fileService.importFile();

    expect(result).toBeNull();
  });

  it('falls back to classic import flow when modern API fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    window.showOpenFilePicker = vi
      .fn()
      .mockRejectedValue(new Error('picker unavailable'));

    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function mockClick(this: HTMLInputElement) {
        this.dispatchEvent(new Event('change'));
      });

    const resultPromise = fileService.importFile();
    vi.advanceTimersByTime(1000);
    const result = await resultPromise;

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('imports selected file in classic flow', async () => {
    const file = new File(['classic content'], 'classic-note.md', {
      type: 'text/markdown',
    });

    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function mockClick(
      this: HTMLInputElement
    ) {
      Object.defineProperty(this, 'files', {
        configurable: true,
        value: [file],
      });
      this.dispatchEvent(new Event('change'));
    });

    const resultPromise = fileService.importFile();
    vi.advanceTimersByTime(1000);
    const result = await resultPromise;

    expect(result).toEqual({ title: 'classic-note', content: 'classic content' });
  });

  it('exports with modern save picker API', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);

    window.showSaveFilePicker = vi.fn().mockResolvedValue({
      createWritable: vi.fn().mockResolvedValue({ write, close }),
    });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

    await fileService.exportFile('My Note', 'saved content');

    expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('saved content');
    expect(close).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it('returns early when modern export is aborted', async () => {
    window.showSaveFilePicker = vi
      .fn()
      .mockRejectedValue({ name: 'AbortError' });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

    await fileService.exportFile('title', 'content');

    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it('uses classic export flow when modern save API is unavailable', async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:classic-url');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    await fileService.exportFile('No API', 'content');

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(revokeSpy).toHaveBeenCalledWith('blob:classic-url');
  });
  
  it('falls back to classic export flow when modern save API fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test-url');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});

    window.showSaveFilePicker = vi
      .fn()
      .mockRejectedValue(new Error('save picker unavailable'));

    await fileService.exportFile('   ', 'classic content');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(revokeSpy).toHaveBeenCalledWith('blob:test-url');
  });
});

