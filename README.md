## Kurswoche Kalender 2026

Static website that shows a **full-year calendar** with **Kurswoche (KW / ISO-8601 week numbers)**:

- A **top card** shows **today’s KW** and its Monday–Sunday date range
- A **sidebar list** shows all **KWs for the selected year** (click to highlight)
- The calendar shows **KW per week row** and highlights **today** (if today is in 2026)
- A **year picker** lets you switch years (persisted in URL + localStorage)

### Open it

- Open `index.html` in your browser (double-click works).
- Or serve it with any static server, e.g.:

```bash
cd kurswoche-kalender-2026
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Notes

- “Kurswoche” is implemented as **ISO week number** (ISO-8601).
- **Self-hosted / offline**: no external assets; all references are relative.
- **Custom font**: put Inter `.woff2` files into `kurswoche-kalender-2026/fonts/` (see `fonts/README.md`).

### URL param

- You can open a specific year via `?year=2026` (also saved to localStorage).


