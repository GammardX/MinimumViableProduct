import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSidebarResize } from './useSidebarResize';

describe('useSidebarResize', () => {
  it('restituisce lo stato predefinito', () => {
    const { result } = renderHook(() => useSidebarResize());

    expect(result.current.sidebarWidth).toBe(250);
    expect(result.current.isResizing).toBe(false);
    expect(result.current.sidebarRef.current).toBeNull();
  });

  it('ridimensiona la larghezza compressa quando il cursore è <= 100', () => {
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

  it('ridimensiona all\'interno dell\'intervallo consentito e ignora >= 600', () => {
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

  it('arresta il ridimensionamento al rilascio del mouse', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.startResizing();
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isResizing).toBe(false);
  });

  it('ripristina la larghezza al clic del ridimensionatore quando precedentemente compresso', () => {
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
  
  it('ignora il movimento del mouse quando non si ridimensiona', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 80 }));
    });

    expect(result.current.sidebarWidth).toBe(250);
  });

  it('non ripristina la larghezza se la precondizione di compressione non è soddisfatta', () => {
    const { result } = renderHook(() => useSidebarResize());

    act(() => {
      result.current.handleResizerClick();
    });

    expect(result.current.sidebarWidth).toBe(250);
  });
});

