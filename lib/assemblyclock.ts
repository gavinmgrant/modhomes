import { createContext, useCallback, useContext, useRef } from "react";

export type AssemblyClockOptions = {
  // Seconds into the assembly that the first piece starts to move, and that
  // the last one lands
  start: number;
  end: number;
  // Seconds every piece takes to fly back out, all at once
  explodeDuration: number;
  // Seconds it stays apart before it builds itself again
  hold: number;
};

// Where an assembly is at a moment: `time` seconds into it, with every piece
// pulled back `apart` of the way (0 to 1) from where that would put it
export type AssemblySample = { time: number; apart: number };

export type AssemblyClock = {
  // Where the assembly is at `now`, in seconds on the frame clock
  sample: (now: number) => AssemblySample;
  // Starts the home coming apart at `now`, from wherever it has got to.
  // False, and nothing changes, if it's already apart or coming apart, or
  // nothing has moved yet
  explode: (now: number) => boolean;
};

// The share of the way apart, `share` of the way through coming apart: the
// entrance's ease-out run backward, so pieces leave slowly, then speed away
export const getApart = (share: number) =>
  Math.pow(Math.min(Math.max(share, 0), 1), 3);

// One clock for every piece of an assembly, so they can all come apart
// together. It runs forward from the first frame. Once exploded, it stops
// where it is while every piece flies back out at once, holds them there for
// `hold` seconds, then runs forward again from where the first piece starts
export const createAssemblyClock = ({
  start,
  end,
  explodeDuration,
  hold,
}: AssemblyClockOptions): AssemblyClock => {
  // The assembly runs forward from `origin` on the frame clock...
  let origin: number | null = null;
  // ...or, while exploded, is stopped `from` seconds into it, since `at`
  let exploded: { at: number; from: number } | null = null;

  const sample = (now: number): AssemblySample => {
    if (exploded) {
      const { at, from } = exploded;
      if (now < at + explodeDuration + hold) {
        return { time: from, apart: getApart((now - at) / explodeDuration) };
      }
      exploded = null;
      origin = at + explodeDuration + hold - start;
    }
    origin ??= now;
    return { time: now - origin, apart: 0 };
  };

  const explode = (now: number) => {
    // Past the end, everything has landed, so it comes apart from there
    const time = Math.min(sample(now).time, end);
    if (exploded || time <= start) return false;
    exploded = { at: now, from: time };
    return true;
  };

  return { sample, explode };
};

export const AssemblyClockContext = createContext<AssemblyClock | null>(null);

// Where the assembly is, given the frame clock's time: from the shared clock
// when there is one, or else from this piece's own first frame
export const useAssemblySample = () => {
  const clock = useContext(AssemblyClockContext);
  const start = useRef<number | null>(null);
  return useCallback(
    (now: number): AssemblySample =>
      clock
        ? clock.sample(now)
        : { time: now - (start.current ??= now), apart: 0 },
    [clock],
  );
};
