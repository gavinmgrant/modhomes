import React from "react";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import { motion } from "framer-motion";
import { Stack } from "@mui/material";

interface FooterProps {
  // Pinned to the bottom of the page's padding, as on the landing page, or
  // else under whatever comes before it, as on the checkout
  pinned?: boolean;
}

const Footer = ({ pinned = true }: FooterProps) => {
  return (
    <Stack
      component="footer"
      position={pinned ? { xs: "sticky", md: "absolute" } : "static"}
      left={16}
      right={16}
      bottom={32}
      alignItems="center"
      marginTop="3rem"
    >
      <Stack direction="row" alignItems="center">
        <Typography variant="body1" fontWeight={500} height={30}>
          <a href="https://www.gavingrant.com" target="_blank" rel="noreferrer">
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
      <Typography variant="body2" textAlign="center" sx={{ opacity: 0.7 }}>
        ModHomes is a demo for a made-up builder.{" "}
        <Link href="/builders" style={{ textDecoration: "underline" }}>
          For builders
        </Link>
        <br />
        Built with Next.js, React Three Fiber and MUI.
      </Typography>
    </Stack>
  );
};

export default Footer;
