import React from "react";
import Link from "next/link";
import Typography from "@mui/material/Typography";

const Footer = () => {
  return (
    <Typography
      position={{ xs: "sticky", md: "absolute" }}
      left={16}
      bottom={16}
      variant="body1"
      fontWeight={500}
      textAlign="center"
      marginTop="3rem"
    >
      <Link href="https://www.gavingrant.co/">
        Built by Gavin Grant
      </Link>
    </Typography>
  );
};

export default Footer;
