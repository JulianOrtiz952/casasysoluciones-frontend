'use client';

import { useRef, type Dispatch, type SetStateAction, type PointerEvent, type MouseEvent } from 'react';

// Keep vertical scrolling and pinch zoom available while handling horizontal drags.
export function useGallerySwipe(count: number, setIndex: Dispatch<SetStateAction<number>>) {
    const start = useRef<{ x: number; y: number; pointerId: number } | null>(null);
    const suppressClick = useRef(false);

    return {
        onPointerDown(event: PointerEvent<HTMLDivElement>) {
            suppressClick.current = false;
            if (count < 2 || !event.isPrimary || event.button !== 0 ||
                (event.target instanceof Element && event.target.closest('button'))) return;
            start.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
        },
        onPointerMove(event: PointerEvent<HTMLDivElement>) {
            const origin = start.current;
            if (!origin || origin.pointerId !== event.pointerId) return;
            const dx = Math.abs(event.clientX - origin.x);
            const dy = Math.abs(event.clientY - origin.y);
            if (dx > 12 && dx > dy * 1.25) {
                suppressClick.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
            }
        },
        onPointerUp(event: PointerEvent<HTMLDivElement>) {
            const origin = start.current;
            if (!origin || origin.pointerId !== event.pointerId) return;
            start.current = null;
            const dx = event.clientX - origin.x;
            const dy = event.clientY - origin.y;
            if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) {
                suppressClick.current = true;
                setIndex(index => (index + (dx < 0 ? 1 : -1) + count) % count);
            }
        },
        onPointerCancel() {
            start.current = null;
        },
        onClickCapture(event: MouseEvent<HTMLDivElement>) {
            if (!suppressClick.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
        },
    };
}
