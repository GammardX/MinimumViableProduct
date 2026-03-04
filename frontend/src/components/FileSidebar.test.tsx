import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FileSidebar from './FileSidebar';

vi.mock('../style/filesidebar.css', () => ({}));

const notes = [
  { id: '1', title: 'One', content: 'a', createdAt: 1 },
  { id: '2', title: 'Two', content: 'b', createdAt: 2 },
];

describe('FileSidebar', () => {
  it('calls onCreate when create button is clicked', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={onCreate}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    await user.click(screen.getByTitle('Nuova nota'));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('calls onImport when import button is clicked', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onImport={onImport}
        onExport={vi.fn()}
      />
    );

    await user.click(screen.getByTitle('Carica da file'));

    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onImport={vi.fn()}
        onExport={onExport}
      />
    );

    await user.click(screen.getByTitle('Salva nota su disco'));

    expect(onExport).toHaveBeenCalledWith('1');
  });

  it('calls onSelect when note is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={onSelect}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    await user.click(screen.getByText('Two'));

    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={onDelete}
        onRename={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    await user.click(screen.getAllByTitle('Elimina')[0]);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('renames note when enter is pressed', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={onRename}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    await user.dblClick(screen.getByText('One'));
    const input = screen.getByDisplayValue('One');
    await user.clear(input);
    await user.type(input, 'Renamed{Enter}');

    expect(onRename).toHaveBeenCalledWith('1', 'Renamed');
  });

  it('cancels rename when escape is pressed', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={onRename}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    await user.dblClick(screen.getByText('Two'));
    const input = screen.getByDisplayValue('Two');
    await user.type(input, '{Escape}');

    expect(onRename).not.toHaveBeenCalled();
  });

  it('saves rename on blur only for non-empty title', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={onRename}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    await user.dblClick(screen.getByText('One'));
    const input = screen.getByDisplayValue('One');
    await user.clear(input);
    await user.tab();
    expect(onRename).not.toHaveBeenCalled();
  });

  it('scrolls down when active note is below viewport', () => {
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: scrollSpy });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(this: HTMLElement) {
      if (this.classList.contains('active')) return { top: 90, bottom: 140 } as DOMRect;
      if (this.classList.contains('file-list')) return { top: 0, bottom: 100 } as DOMRect;
      return { top: 0, bottom: 0 } as DOMRect;
    });

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(scrollSpy).toHaveBeenCalledWith({ top: 60, behavior: 'smooth' });
  });

  it('scrolls up when active note is above viewport', () => {
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: scrollSpy });
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(this: HTMLElement) {
      if (this.classList.contains('active')) return { top: -10, bottom: 20 } as DOMRect;
      if (this.classList.contains('file-list')) return { top: 0, bottom: 100 } as DOMRect;
      return { top: 0, bottom: 0 } as DOMRect;
    });

    render(
      <FileSidebar
        notes={notes}
        activeId='1'
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onImport={vi.fn()}
        onExport={vi.fn()}
      />
    );

    expect(scrollSpy).toHaveBeenCalledWith({ top: -30, behavior: 'smooth' });
  });
});

