import React from "react";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import { motion } from "framer-motion";
import { Stack } from "@mui/material";

const Footer = () => {
  return (
    <Stack
      position={{ xs: "sticky", md: "absolute" }}
      left={16}
      bottom={16}
      direction="row"
      alignItems="center"
      marginTop="3rem"
    >
      <Typography variant="body1" fontWeight={500} height={30}>
        <a href="https://www.gavingrant.co/" target="_blank" rel="noreferrer">
          Built by Gavin Grant
        </a>
      </Typography>
      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
        <Typography variant="body1" fontWeight={500} ml="0.75rem">
          <a
            href="https://github.com/gavinmgrant/modhomes"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon />
          </a>
        </Typography>
      </motion.div>
    </Stack>
  );
};

export default Footer;
