import { useEffect, useRef, useState } from "react";
import type { OrigamiSession } from "../../domain/origami/session";

export function useSessionPlayback(session: OrigamiSession) {
  const [time, setTimeState] = useState(0); const [playing, setPlaying] = useState(false); const [rate, setRate] = useState(1);
  const frame = useRef<number | undefined>(undefined); const previous = useRef<number | undefined>(undefined);
  const setTime = (value: number) => setTimeState(Math.max(0, Math.min(session.duration, value)));
  useEffect(() => {
    if (!playing) { previous.current = undefined; return; }
    const tick = (now: number) => { const delta = previous.current === undefined ? 0 : (now - previous.current) / 1000; previous.current = now; setTimeState((current) => { const next = Math.min(session.duration, current + delta * rate); if (next >= session.duration) setPlaying(false); return next; }); frame.current = requestAnimationFrame(tick); };
    frame.current = requestAnimationFrame(tick); return () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current); };
  }, [playing, rate, session.duration]);
  const boundaries = [0, ...session.steps.flatMap(({ start, end }) => [start, end])];
  return { time, playing, rate, setRate, setTime, play: () => { if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setPlaying(false); setTimeState(boundaries.find((value) => value > time + 1e-6) ?? session.duration); return; } if (time >= session.duration) setTimeState(0); setPlaying(true); }, pause: () => setPlaying(false), restart: () => { setPlaying(false); setTimeState(0); }, previous: () => { setPlaying(false); setTimeState([...boundaries].reverse().find((value) => value < time - 1e-6) ?? 0); }, next: () => { setPlaying(false); setTimeState(boundaries.find((value) => value > time + 1e-6) ?? session.duration); } };
}
