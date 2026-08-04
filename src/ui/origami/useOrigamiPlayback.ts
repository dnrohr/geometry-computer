import { useCallback, useEffect, useRef, useState } from "react";
import type { RenderDocumentV2 } from "../../domain/render/types";
import { adjacentBoundary, clampTime } from "../../domain/origami/timeline";

export function useOrigamiPlayback(document: RenderDocumentV2) {
  const [time, setTimeState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const frame = useRef<number | undefined>(undefined);
  const previous = useRef<number | undefined>(undefined);
  const setTime = useCallback(
    (next: number) => setTimeState(clampTime(next, document.metadata.duration)),
    [document.metadata.duration],
  );

  useEffect(() => {
    if (!playing) {
      previous.current = undefined;
      return;
    }
    const tick = (now: number) => {
      const delta =
        previous.current === undefined ? 0 : (now - previous.current) / 1000;
      previous.current = now;
      setTimeState((current) => {
        const next = clampTime(
          current + delta * playbackRate,
          document.metadata.duration,
        );
        if (next >= document.metadata.duration) setPlaying(false);
        return next;
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [document.metadata.duration, playbackRate, playing]);

  return {
    duration: document.metadata.duration,
    time,
    playing,
    playbackRate,
    setPlaybackRate,
    setTime,
    play: () => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setPlaying(false);
        setTimeState(adjacentBoundary(document, time, 1));
        return;
      }
      if (time >= document.metadata.duration) setTimeState(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    restart: () => {
      setPlaying(false);
      setTimeState(0);
    },
    previous: () => {
      setPlaying(false);
      setTimeState((current) => adjacentBoundary(document, current, -1));
    },
    next: () => {
      setPlaying(false);
      setTimeState((current) => adjacentBoundary(document, current, 1));
    },
  };
}
