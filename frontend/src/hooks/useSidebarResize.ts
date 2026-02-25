import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSidebarResizeReturn {
    sidebarWidth: number;
    isResizing: boolean;
    sidebarRef: React.RefObject<HTMLDivElement | null>;
    startResizing: () => void;
    handleResizerClick: () => void;
}

export function useSidebarResize(): UseSidebarResizeReturn {
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const startWidthRef = useRef(0);

    const startResizing = useCallback(() => {
        setIsResizing(true);
        startWidthRef.current = sidebarWidth;
    }, [sidebarWidth]);

    const stopResizing = useCallback(() => setIsResizing(false), []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = mouseMoveEvent.clientX;
                if (newWidth <= 100) {
                    setSidebarWidth(10);
                } else if (newWidth < 600) {
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    const handleResizerClick = () => {
        if (startWidthRef.current === 10 && sidebarWidth === 10) {
            setSidebarWidth(250);
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    return { sidebarWidth, isResizing, sidebarRef, startResizing, handleResizerClick };
}
