import type { useOrigamiPlayback } from "./useOrigamiPlayback";

export function OrigamiPlaybackControls({
  playback,
}: {
  playback: ReturnType<typeof useOrigamiPlayback>;
}) {
  const duration = playback.duration;
  return (
    <div className="origami-playback" aria-label="Origami playback controls">
      <div className="origami-playback-buttons">
        <button type="button" onClick={playback.restart}>
          Restart
        </button>
        <button
          type="button"
          onClick={playback.previous}
          aria-label="Previous action"
        >
          Previous
        </button>
        {playback.playing ? (
          <button type="button" onClick={playback.pause}>
            Pause
          </button>
        ) : (
          <button type="button" onClick={playback.play}>
            Play
          </button>
        )}
        <button type="button" onClick={playback.next} aria-label="Next action">
          Next
        </button>
      </div>
      <label>
        Timeline
        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={playback.time}
          onChange={(event) => playback.setTime(Number(event.target.value))}
        />
      </label>
      <span className="origami-time">
        {playback.time.toFixed(1)}s / {duration.toFixed(1)}s
      </span>
      <label>
        Speed
        <select
          value={playback.playbackRate}
          onChange={(event) =>
            playback.setPlaybackRate(Number(event.target.value))
          }
        >
          <option value="0.5">0.5×</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
        </select>
      </label>
    </div>
  );
}
