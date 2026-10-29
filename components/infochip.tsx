import React from "react";
import { useMediaQuery } from "@mui/material";
import { useSpring, animated, config } from "@react-spring/web";
import { IconHome2 } from "@tabler/icons-react";
import { PANEL } from "./panel";

interface InfoChipProps {
  name: string;
  area: number;
}

const InfoChip = ({ name, area }: InfoChipProps) => {
  // MUI's toolbar is 64px tall from 600px up, 56px below that
  const isWide = useMediaQuery("(min-width:600px)");
  const floorArea = useSpring({
    val: area,
    from: { val: 0 },
    config: config.molasses,
  });

  return (
    <div
      style={{
        ...PANEL,
        position: "absolute",
        // the canvas comes later in the page, so lift the chip above it
        zIndex: 10,
        // sits just under the navbar (16px offset + toolbar height)
        top: isWide ? 92 : 84,
        left: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px 6px 10px",
        borderRadius: 999,
        fontSize: isWide ? 15 : 14,
      }}
    >
      <IconHome2 size={18} aria-hidden />
      <span style={{ fontWeight: 600 }}>{name}</span>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>
        <animated.span>
          {floorArea.val.to((val) =>
            new Intl.NumberFormat().format(Math.floor(val))
          )}
        </animated.span>{" "}
        sf
      </span>
    </div>
  );
};

export default InfoChip;
