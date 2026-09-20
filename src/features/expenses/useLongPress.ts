import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

const LONG_PRESS_MS = 480;
/** A finger that travels this far is scrolling, not pressing. */
const MOVE_TOLERANCE_PX = 10;

export interface LongPressHandlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onContextMenu: (e: MouseEvent<HTMLElement>) => void;
  onClickCapture: (e: MouseEvent<HTMLElement>) => void;
}

/** Press and hold on a row. The tap that follows a long press is swallowed. */
export function useLongPress(onLongPress: () => void): LongPressHandlers {
  const callback = useRef(onLongPress);
  callback.current = onLongPress;
  const timer = useRef<number | undefined>(undefined);
  const origin = useRef({ x: 0, y: 0 });
  const fired = useRef(false);

  const cancel = () => window.clearTimeout(timer.current);
  useEffect(() => cancel, []);

  return {
    onPointerDown: (e) => {
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      cancel();
      timer.current = window.setTimeout(() => {
        fired.current = true;
        callback.current();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (e) => {
      if (Math.abs(e.clientX - origin.current.x) > MOVE_TOLERANCE_PX || Math.abs(e.clientY - origin.current.y) > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e) => e.preventDefault(),
    onClickCapture: (e) => {
      if (!fired.current) return;
      fired.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
