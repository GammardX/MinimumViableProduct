import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSidebarResize } from './useSidebarResize';

describe('useSidebarResize', () => {
  it('returns default state', () => {
    const { result } = renderHook(() => useSidebarResize());

    expect(result.current.sidebarWidth).toBe(250);
    expect(result.current.isResizing).toBe(false);
    expect(result.current.sidebarRef.current).toBeNull();
  });

  it('resizes to collapsed width when cursor is <= 100', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.startResizing();
    });
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }));
    });

    expect(result.current.sidebarWidth).toBe(10);
    expect(result.current.isResizing).toBe(true);
  });

  it('resizes within allowed range and ignores >= 600', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.startResizing();
    });
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 320 }));
    });
    expect(result.current.sidebarWidth).toBe(320);

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 700 }));
    });
    expect(result.current.sidebarWidth).toBe(320);
  });

  it('stops resizing on mouseup', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.startResizing();
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isResizing).toBe(false);
  });

  it('restores width on resizer click when previously collapsed', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.startResizing();
    });
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    act(() => {
      result.current.startResizing();
    });
    act(() => {
      result.current.handleResizerClick();
    });

    expect(result.current.sidebarWidth).toBe(250);
  });
  
  it('ignores mousemove when not resizing', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }));
    });

    expect(result.current.sidebarWidth).toBe(250);
  });

  it('does not restore width if collapse precondition is not met', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.handleResizerClick();
    });

    expect(result.current.sidebarWidth).toBe(250);
  });
});

