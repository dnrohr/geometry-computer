import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { OrigamiPlaybackControls } from "./OrigamiPlaybackControls";

const playback = (playing = false) => ({
  duration: 5,
  time: 1.25,
  playing,
  playbackRate: 1,
  setPlaybackRate: vi.fn(),
  setTime: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  restart: vi.fn(),
  previous: vi.fn(),
  next: vi.fn(),
});

describe("OrigamiPlaybackControls", () => {
  it("exposes timeline and action navigation", () => {
    const controls = playback();
    render(<OrigamiPlaybackControls playback={controls} />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Next action" }));
    fireEvent.change(screen.getByRole("slider", { name: "Timeline" }), {
      target: { value: "3.5" },
    });
    expect(controls.play).toHaveBeenCalledOnce();
    expect(controls.next).toHaveBeenCalledOnce();
    expect(controls.setTime).toHaveBeenCalledWith(3.5);
  });

  it("shows pause while playing", () => {
    const controls = playback(true);
    render(<OrigamiPlaybackControls playback={controls} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(controls.pause).toHaveBeenCalledOnce();
  });
});
