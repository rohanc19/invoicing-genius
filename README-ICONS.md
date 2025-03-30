
# Icon Generation for Invoicing Genius

This document explains how to generate the necessary icon files for the Invoicing Genius PWA.

## Prerequisites

- Install [ImageMagick](https://imagemagick.org/script/download.php)
- Node.js (already needed for the project)

## Generating Icons

1. Run the icon generation script:

```bash
node scripts/generate-icons.js
```

This will create PNG icons in various sizes from the SVG template.

## Customizing Icons

To customize the icon:

1. Edit the SVG template at `public/icons/icon.svg`
2. Run the generation script again to create PNG files

## Manual Icon Creation (Alternative)

If you prefer to create your own custom icons:

1. Design icons at these dimensions: 16x16, 32x32, 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, and 512x512 pixels
2. Save them as PNG files in the `public/icons/` directory with filenames matching `icon-SIZExSIZE.png` (e.g., `icon-192x192.png`)
3. Ensure all icon files referenced in `manifest.json` exist

## Icon Usage

These icons will be used for:
- App icons on mobile home screens
- Browser tab favicon
- App splash screens
- PWA installation prompts
