import Head from "next/head";

// Share images and canonical links need absolute URLs, so they point at the
// production site
export const SITE_URL = "https://modhomes.vercel.app";
const SITE_NAME = "ModHomes";

interface PageMetaProps {
  title: string;
  description: string;
  path: string;
  // A 1200x630 card in public/og
  image: string;
  imageAlt: string;
}

const PageMeta = ({
  title,
  description,
  path,
  image,
  imageAlt,
}: PageMetaProps) => {
  const url = `${SITE_URL}${path}`;
  const imageUrl = `${SITE_URL}${image}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />
    </Head>
  );
};

export default PageMeta;
