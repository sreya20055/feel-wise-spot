# OpenDyslexic Fonts

This folder contains the OpenDyslexic font files for BlindSpot's accessibility features.

## About OpenDyslexic

OpenDyslexic is a free, open-source font designed to help improve reading proficiency for people with dyslexia. The font has unique characteristics that help distinguish similar-looking letters and improve reading flow.

## Required Font Files

To complete the dyslexic font setup, you need to download these font files from [https://opendyslexic.org/](https://opendyslexic.org/) and place them in this folder:

### Regular Fonts:
- `OpenDyslexic-Regular.woff2`
- `OpenDyslexic-Regular.woff`
- `OpenDyslexic-Bold.woff2`
- `OpenDyslexic-Bold.woff`
- `OpenDyslexic-Italic.woff2`
- `OpenDyslexic-Italic.woff`
- `OpenDyslexic-BoldItalic.woff2`
- `OpenDyslexic-BoldItalic.woff`

### Monospace Font (Optional):
- `OpenDyslexicMono-Regular.woff2`
- `OpenDyslexicMono-Regular.woff`

## Installation Steps

1. **Download OpenDyslexic**:
   - Visit [https://opendyslexic.org/](https://opendyslexic.org/)
   - Download the font package
   - Extract the WOFF/WOFF2 files

2. **Convert if needed**:
   - If you only have TTF/OTF files, convert them to WOFF2/WOFF format
   - Use tools like [CloudConvert](https://cloudconvert.com/) or [Font Squirrel](https://www.fontsquirrel.com/tools/webfont-generator)

3. **Place files**:
   - Copy the WOFF2 and WOFF files to this folder
   - Ensure file names match the CSS declarations

4. **Update index.html**:
   - The font CSS is already configured in `OpenDyslexic.css`
   - Add this line to your `index.html` `<head>` section:
   ```html
   <link rel="stylesheet" href="/fonts/dyslexic/OpenDyslexic.css">
   ```

## Usage in BlindSpot

Once the fonts are installed, users can enable dyslexic-friendly fonts through:

- **Accessibility Settings**: Navigate to `/accessibility` page
- **Tailwind Class**: Use `font-dyslexic` class in components
- **CSS Variable**: Use `font-family: 'OpenDyslexic', Arial, sans-serif;`

## Current Status

✅ **Configured**: Tailwind config includes `font-dyslexic` class
✅ **CSS Ready**: @font-face declarations created
✅ **Font Files**: OpenDyslexic OTF files installed
✅ **Linked**: CSS file included in index.html
✅ **Ready**: Dyslexic fonts are fully functional!

## License

OpenDyslexic is released under the SIL Open Font License (OFL). This allows free use in both commercial and non-commercial applications.