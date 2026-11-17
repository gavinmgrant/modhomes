import { createAssemblyClock, getApart } from "../lib/assemblyclock";
import { EXPLODE } from "../components/assembly";

const OPTIONS = { start: 1, end: 10, explodeDuration: 2, hold: 5 };

describe("assembly clock", () => {
  it("runs forward from the first frame", () => {
    const clock = createAssemblyClock(OPTIONS);
    expect(clock.sample(100)).toEqual({ time: 0, apart: 0 });
    expect(clock.sample(103.5)).toEqual({ time: 3.5, apart: 0 });
  });

  it("sends every piece out at once, holds, then builds again", () => {
    const clock = createAssemblyClock(OPTIONS);
    clock.sample(0);
    expect(clock.explode(30)).toBe(true);
    // Stopped at the end while every piece flies out together
    expect(clock.sample(31)).toEqual({ time: 10, apart: getApart(0.5) });
    expect(clock.sample(32)).toEqual({ time: 10, apart: 1 });
    // Held apart for 5 seconds
    expect(clock.sample(36.9).apart).toBe(1);
    // Then forward again from where the first piece starts
    expect(clock.sample(37)).toEqual({ time: 1, apart: 0 });
    expect(clock.sample(40)).toEqual({ time: 4, apart: 0 });
  });

  it("comes apart from wherever it has got to", () => {
    const clock = createAssemblyClock(OPTIONS);
    clock.sample(0);
    expect(clock.explode(5)).toBe(true);
    expect(clock.sample(6).time).toBe(5);
  });

  it("ignores clicks while apart, or before anything has moved", () => {
    const clock = createAssemblyClock(OPTIONS);
    expect(clock.explode(0)).toBe(false);
    expect(clock.explode(0.5)).toBe(false);
    expect(clock.explode(20)).toBe(true);
    expect(clock.explode(21)).toBe(false);
    expect(clock.explode(26)).toBe(false);
    // Building again, it can be taken apart again
    expect(clock.explode(30)).toBe(true);
    expect(clock.sample(30.5).time).toBe(4);
  });

  it("leaves slowly, then speeds away", () => {
    expect(getApart(0)).toBe(0);
    expect(getApart(0.5)).toBeLessThan(0.5);
    expect(getApart(1)).toBe(1);
    expect(getApart(2)).toBe(1);
  });

  it("takes the hero apart in under two seconds and holds it for five", () => {
    expect(EXPLODE.duration).toBeLessThan(2);
    expect(EXPLODE.hold).toBe(5);
  });
});
