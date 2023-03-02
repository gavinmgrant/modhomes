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
import MODELS from "../lib/models";

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
      sx={{
        position: "absolute",
        width: "calc(100% - 2rem)",
        top: "1rem",
        left: "1rem",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "0.5rem",
        border: "1px dashed #131414",
        background: router.pathname === "/" ? "#f9f7f1" : "none",
        color: "#131414",
        boxShadow: "none",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={500}
        marginLeft={{ xs: "1rem", sm: "1.5rem" }}
      >
        <Link href="/">ModHomes</Link>
      </Typography>
      <Toolbar>
        {isMobile ? (
          <IconButton
            role="button"
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuClick}
            sx={{ margin: 0, padding: "0.5rem" }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Button
            size="large"
            color="inherit"
            aria-label="menu"
            onClick={handleMenuClick}
          >
            Models
          </Button>
        )}
        <Drawer anchor="right" open={open} onClose={handleMenuClose}>
          {MODELS.map((model) => (
            <MenuItem
              key={model.slug}
              onClick={() => handleItemClick(model.slug)}
              sx={{
                color: "#131414",
                padding: "1rem 3rem",
              }}
            >
              {model.name}
            </MenuItem>
          ))}
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
