"""Small dependency-light scene used to verify OpenGL and ffmpeg."""

from manimlib import BLUE, GOLD, Circle, FadeIn, Scene, ShowCreation, Square, Transform


class GeometryComputerSmoke(Scene):
    def construct(self):
        square = Square(side_length=3).set_stroke(BLUE, width=6)
        circle = Circle(radius=1.5).set_stroke(GOLD, width=6)
        self.play(FadeIn(square), run_time=0.25)
        self.play(ShowCreation(circle), run_time=0.25)
        self.play(Transform(square, circle), run_time=0.5)
        self.wait(0.25)
