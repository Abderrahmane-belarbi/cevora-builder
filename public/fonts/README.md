# Bundled fonts

These font files are served locally for browser styling and PDF embedding. The application does not request fonts from third-party services at runtime.

Sources: [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl).

| Local ID | Font | License file |
| --- | --- | --- |
| lato | Lato | lato-OFL.txt |
| open-sans | Open Sans | open-sans-OFL.txt |
| source-serif | Source Serif 4 | source-serif-OFL.txt |
| noto-arabic | Noto Sans Arabic | noto-arabic-OFL.txt |
| naskh | Noto Naskh Arabic | naskh-OFL.txt |
| cairo | Cairo | cairo-OFL.txt |
| amiri | Amiri | amiri-OFL.txt |

Variable sources were frozen at regular (400) and bold (700) with other axes at their defaults using fontTools. Lato, Open Sans, Source Serif 4, and Amiri include italic and bold italic files. For the other families, PDF italic marks use the corresponding upright face.

To regenerate font assets during development, install `fonttools` for Python and run `python scripts/prepare-fonts.py` from the project root. This helper is not needed for installation or builds. CSS font-face declarations live in `src/app/fonts.css`.
