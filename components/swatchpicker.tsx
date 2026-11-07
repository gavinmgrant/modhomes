import React, { useId, useRef, useState } from "react";
import { ClickAwayListener } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Swatch from "./swatch";
import { Captioned } from "./docktoggle";
import { PANEL, paper } from "./panel";

export interface SwatchOption<T extends string = string> {
  name: string;
  background: string;
  value: T;
}

interface SwatchPickerProps<T extends string> {
  label: string;
  options: readonly SwatchOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// How far the options rise as they appear, in px, and the pause between
// each one starting, in seconds, from the bottom up
const RISE = 10;
const STAGGER = 0.035;

// One swatch showing the current choice, with its label as a caption under
// it. Clicking it opens a column of every option rising out of the dock
// above it; picking one, or clicking anywhere else, or Escape closes it again
const SwatchPicker = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SwatchPickerProps<T>) => {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const still = useReducedMotion();
  const current =
    options.find((option) => option.value === value) ?? options[0];

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Captioned
        caption={label}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) close();
        }}
      >
        <div style={{ position: "relative" }}>
          <Swatch
            ref={trigger}
            name={`${label}: ${current.name}`}
            background={current.background}
            selected={open}
            expanded={open}
            controls={id}
            onSelect={() => setOpen(!open)}
          />
          <AnimatePresence>
            {open && (
              <motion.div
                id={id}
                role="group"
                aria-label={label}
                initial={{ opacity: 0, y: still ? 0 : RISE }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: still ? 0 : RISE / 2 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{
                  ...PANEL,
                  // nested in the dock's blur, which it can't see past, so
                  // it's made more solid instead
                  background: paper(0.95),
                  position: "absolute",
                  bottom: "calc(100% + 14px)",
                  left: "50%",
                  x: "-50%",
                  display: "flex",
                  flexDirection: "column",
                  padding: 4,
                  borderRadius: 999,
                }}
              >
                {options.map((option, i) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, y: still ? 0 : RISE }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                      delay: still ? 0 : (options.length - 1 - i) * STAGGER,
                    }}
                  >
                    <Swatch
                      name={option.name}
                      background={option.background}
                      selected={option.value === value}
                      onSelect={() => {
                        onChange(option.value);
                        close();
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Captioned>
    </ClickAwayListener>
  );
};

export default SwatchPicker;
