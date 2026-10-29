import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  AppBar,
  Button,
  Toolbar,
  Typography,
  IconButton,
  MenuItem,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { IconLayoutGrid, IconX } from "@tabler/icons-react";
import MODELS from "../lib/models";
import { FOCUS_RING, INK, PANEL, PAPER } from "./panel";

const HOVER = { "&:hover": { background: "rgba(19, 20, 20, 0.06)" } };

const NavBar = () => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleItemClick = (home: string) => {
    router.push(`/homes/${home}`);
    setAnchorEl(null);
  };

  return (
    <AppBar
      style={{
        ...PANEL,
        position: "absolute",
        width: "calc(100% - 2rem)",
        top: "1rem",
        left: "1rem",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 999,
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        marginLeft={{ xs: "1.25rem", sm: "1.75rem" }}
      >
        <Link href="/">ModHomes</Link>
      </Typography>
      {/* Right inset matches the space above and below the 40px button
          (56px toolbar on xs, 64px from sm), so it sits centred in the end cap */}
      <Toolbar sx={{ paddingRight: { xs: "8px", sm: "12px" } }}>
        {isMobile ? (
          <IconButton
            role="button"
            size="large"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuClick}
            sx={{ padding: "0.5rem", ...HOVER, ...FOCUS_RING }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Button
            color="inherit"
            aria-label="menu"
            onClick={handleMenuClick}
            startIcon={<IconLayoutGrid size={18} aria-hidden />}
            sx={{
              height: 40,
              padding: "0 16px",
              borderRadius: 999,
              textTransform: "none",
              fontSize: 15,
              ...HOVER,
              ...FOCUS_RING,
            }}
          >
            Models
          </Button>
        )}
        <Drawer
          anchor="right"
          open={open}
          onClose={handleMenuClose}
          PaperProps={{
            style: {
              width: 300,
              maxWidth: "calc(100vw - 32px)",
              padding: 12,
              background: PAPER,
              color: INK,
            },
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 4px 12px 12px",
            }}
          >
            <Typography fontWeight={600} fontSize={18}>
              Models
            </Typography>
            <IconButton
              aria-label="Close"
              onClick={handleMenuClose}
              sx={{ color: INK, ...HOVER, ...FOCUS_RING }}
            >
              <IconX size={20} />
            </IconButton>
          </div>
          {MODELS.map((model) => {
            const selected = model.slug === router.query.home;

            return (
              <MenuItem
                key={model.slug}
                selected={selected}
                onClick={() => handleItemClick(model.slug)}
                sx={{
                  justifyContent: "space-between",
                  // MenuItem resets min-height from sm up, so set both
                  minHeight: { xs: 44, sm: 44 },
                  marginBottom: "2px",
                  padding: "0 16px",
                  borderRadius: 999,
                  color: INK,
                  ...HOVER,
                  "&.Mui-selected, &.Mui-selected:hover": {
                    background: INK,
                    color: PAPER,
                  },
                  "&.Mui-focusVisible": {
                    outline: `2px solid ${INK}`,
                    outlineOffset: -2,
                  },
                }}
              >
                <span>{model.name}</span>
                <span style={{ fontSize: 14, opacity: 0.6 }}>
                  {new Intl.NumberFormat().format(model.area)} sf
                </span>
              </MenuItem>
            );
          })}
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
