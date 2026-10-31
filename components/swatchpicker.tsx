import React, { useId, useRef, useState } from "react";
import { ClickAwayListener, Typography } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Swatch from "./swatch";
import { PANEL } from "./panel";

export interface SwatchOption {
  name: string;
  background: string;
  value: string;
}

interface SwatchPickerProps {
  label: string;
  options: readonly SwatchOption[];
  value: string;
  onChange: (value: string) => void;
}

// How far the options rise as they appear, in px, and the pause between
// each one starting, in seconds, from the bottom up
const RISE = 10;
const STAGGER = 0.035;

// One swatch showing the current choice, with its label as a caption under
// it, so each picker is only as wide as its swatch. Clicking it opens a
// column of every option rising out of the dock above it; picking one, or
// clicking anywhere else, or Escape closes it again
const SwatchPicker = ({
  label,
  options,
  value,
  onChange,
}: SwatchPickerProps) => {
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
      <div
        style={{
          display: "flex",
          // The label comes first for screen readers but shows underneath
          flexDirection: "column-reverse",
          alignItems: "center",
          gap: 2,
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) close();
        }}
      >
        <Typography
          component="span"
          // tucked up into the space under the swatch's dot
          sx={{ fontSize: 11, lineHeight: 1.2, opacity: 0.6, marginTop: -0.75 }}
        >
          {label}
        </Typography>
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
                  background: "rgba(249, 247, 241, 0.95)",
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
      </div>
    </ClickAwayListener>
  );
};

export default SwatchPicker;
