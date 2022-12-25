import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuIcon from "@mui/icons-material/Menu";
import MODELS from "../lib/models";

const NavBar = () => {
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
        width: "calc(100% - 2rem)",
        top: "1rem",
        left: "1rem",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "0.5rem",
        backgroundColor: "#01257D",
        color: "#ffffff",
      }}
    >
      <Typography variant="h6" fontWeight={500} sx={{ ml: "2rem" }}>
        <Link href="/">ModHomes</Link>
      </Typography>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenuClick}
        >
          <MenuIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          {MODELS.map((model) => (
            <MenuItem
              key={model.slug}
              onClick={() => handleItemClick(model.slug)}
              sx={{ color: "#01257D" }}
            >
              {model.name}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
