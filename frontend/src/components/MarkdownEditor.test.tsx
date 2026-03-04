import { act, fireEvent, render, screen } from '@testing-library/react';
import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MarkdownEditor from './MarkdownEditor';

const shared = vi.hoisted(() => ({
  toggleSideBySide: vi.fn(),
  currentInstance: null as any,
  lastOptions: null as any,
}));

vi.mock('easymde/dist/easymde.min.css', () => ({}));
vi.mock('../style/md-editor.css', () => ({}));
vi.mock('highlight.js/styles/vs.css', () => ({}));
vi.mock('./utils/languageImports', () => ({}));
vi.mock('highlight.js', () => ({ default: {} }));

vi.mock('easymde', () => ({ default: { toggleSideBySide: shared.toggleSideBySide } }));

vi.mock('react-simplemde-editor', () => ({
  default: ({ value, onChange, getMdeInstance, options }: any) => {
    shared.lastOptions = options;
    useEffect(() => {
      if (getMdeInstance) getMdeInstance(shared.currentInstance);
    }, [getMdeInstance]);

    return (
      <div>
        <button onClick={() => onChange('changed text')}>change</button>
        <div data-testid='mde-value'>{value}</div>
      </div>
    );
  },
}));

describe('MarkdownEditor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    shared.toggleSideBySide.mockReset();
    shared.lastOptions = null;
    shared.currentInstance = {
      isSideBySideActive: vi.fn(() => false),
      codemirror: { scrollTo: vi.fn() },
      gui: { preview: { scrollTop: 10 } },
    };
  });

  it('propagates changes and instance ready callback', () => {
    const onChange = vi.fn();
    const onInstanceReady = vi.fn();

    render(<MarkdownEditor initialValue='initial' onChange={onChange} onInstanceReady={onInstanceReady} />);

    fireEvent.click(screen.getByText('change'));
    expect(onChange).toHaveBeenCalledWith('changed text');
    expect(onInstanceReady).toHaveBeenCalledWith(shared.currentInstance);

    act(() => vi.advanceTimersByTime(60));
    expect(shared.toggleSideBySide).toHaveBeenCalledWith(shared.currentInstance);
    expect(shared.currentInstance.codemirror.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does not toggle side-by-side when already active', () => {
    shared.currentInstance.isSideBySideActive = vi.fn(() => true);
    render(<MarkdownEditor initialValue='x' />);

    act(() => vi.advanceTimersByTime(60));
    expect(shared.toggleSideBySide).not.toHaveBeenCalled();
  });

  it('runs custom select-chapter toolbar action in heading and no-heading cases', () => {
    render(<MarkdownEditor initialValue='x' />);

    const tool = shared.lastOptions.toolbar.find((t: any) => typeof t === 'object' && t.name === 'select-chapter');
    const setSelection = vi.fn();
    const focus = vi.fn();

    tool.action({
      codemirror: {
        getCursor: () => ({ line: 3, ch: 0 }),
        getLine: (i: number) => ['# A', 'text', '## B', 'body', '# C'][i],
        lineCount: () => 5,
        setSelection,
        focus,
      },
    } as any);

    tool.action({
      codemirror: {
        getCursor: () => ({ line: 0, ch: 0 }),
        getLine: () => 'plain text',
        lineCount: () => 1,
        setSelection,
        focus,
      },
    } as any);

    expect(setSelection).toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
  });

  it('handles preview click for note link', () => {
    const onNavigate = vi.fn();
    const { container } = render(<MarkdownEditor initialValue='x' onNavigate={onNavigate} />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;

    const noteLink = document.createElement('a');
    noteLink.setAttribute('href', '#note:note-1#sec');
    wrapper.appendChild(noteLink);
    fireEvent.click(noteLink);

    expect(onNavigate).toHaveBeenCalledWith('note-1', 'sec');
  });

  it('handles preview click for raw anchor link', () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'raw-anchor') return { scrollIntoView } as any;
      return null;
    });

    const { container } = render(<MarkdownEditor initialValue='x' />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;

    const anchorRaw = document.createElement('a');
    anchorRaw.setAttribute('href', '#raw-anchor');
    wrapper.appendChild(anchorRaw);
    fireEvent.click(anchorRaw);

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('handles preview click for normalized anchor link', () => {
    const scrollIntoView = vi.fn();
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'anchorid') return { scrollIntoView } as any;
      return null;
    });

    const { container } = render(<MarkdownEditor initialValue='x' />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;

    const anchorNormalized = document.createElement('a');
    anchorNormalized.setAttribute('href', '#Anchor Id');
    wrapper.appendChild(anchorNormalized);
    fireEvent.click(anchorNormalized);

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('handles preview click for missing anchor without crashing', () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null);

    const { container } = render(<MarkdownEditor initialValue='x' />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;

    const missingAnchor = document.createElement('a');
    missingAnchor.setAttribute('href', '#not-found');
    wrapper.appendChild(missingAnchor);

    expect(() => fireEvent.click(missingAnchor)).not.toThrow();
  });

  it('handles preview click on link without href', () => {
    const { container } = render(<MarkdownEditor initialValue='x' />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;

    const noHref = document.createElement('a');
    wrapper.appendChild(noHref);

    expect(() => fireEvent.click(noHref)).not.toThrow();
  });

  it('handles preview click on non-link element', () => {
    const { container } = render(<MarkdownEditor initialValue='x' />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;

    const plain = document.createElement('span');
    wrapper.appendChild(plain);

    expect(() => fireEvent.click(plain)).not.toThrow();
  });

  it('does not call onNavigate when not provided', () => {
    const { container } = render(<MarkdownEditor initialValue='x' />);
    const wrapper = container.querySelector('.editor-fade-container') as HTMLDivElement;
    const noteLink = document.createElement('a');
    noteLink.setAttribute('href', '#note:note-2#x');
    wrapper.appendChild(noteLink);

    expect(() => fireEvent.click(noteLink)).not.toThrow();
  });
});
