# Inter

`Inter-latin.woff2` is Inter 4.001, made from `Inter[opsz,wght].ttf` in [Inter-4.1-GoogleFonts.zip](https://github.com/rsms/inter/files/15438431/Inter-4.1-GoogleFonts.zip), the build Inter's author made for Google Fonts from github.com/rsms/inter at commit `66647c0bb`. It's byte for byte the file Google Fonts serves Inter from (`ofl/inter` in github.com/google/fonts), so the site looks just as it did when `next/font/google` downloaded it. It's licensed under the SIL Open Font License 1.1, in `LICENSE.txt`.

It's this build rather than the newer v4.1 release because v4.1 dropped the rule that sets the x between two numbers as a multiplication sign, which the model names use: Mod 1x1 shows as Mod 1×1. The letters are otherwise the same.

`pages/_app.tsx` loads it with `next/font/local`, so `next build` doesn't fetch anything from Google Fonts.

It's cut down the way Google cuts it for the site:

- Its optical size (`opsz`) is fixed at 14, Inter's text design. With the axis left in, browsers would switch the large headings to Inter Display.
- The weight axis is kept whole. `_app.tsx` declares 400 to 700, as before.
- It keeps only Google's latin subset of characters, plus a few combining accents, which covers all of the site's text. Other characters, such as those of latin-ext, fall back to the system sans-serif.
- It keeps the tabular and proportional figures (`tnum`, `pnum`), which the prices and dates use, and drops Inter's stylistic alternates.

To make it again, with [fonttools](https://github.com/fonttools/fonttools) and brotli (`pip install fonttools brotli`):

```bash
fonttools varLib.instancer "Inter[opsz,wght].ttf" opsz=14 -o pinned.ttf
pyftsubset pinned.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
  --layout-features+=tnum,pnum --flavor=woff2 \
  --output-file=Inter-latin.woff2
```
