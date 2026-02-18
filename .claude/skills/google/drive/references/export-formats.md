# Google Drive Export Formats

Reference guide for exporting Google Workspace files to different formats.

## Overview

Google Workspace files (Docs, Sheets, Slides, etc.) are stored as structured data, not traditional file formats. To download them, you must export to a standard format using the `--export-type` parameter.

## Export Format Table

### Google Docs

| Format | MIME Type | Extension | Use Case |
|--------|-----------|-----------|----------|
| PDF | `application/pdf` | .pdf | Sharing, printing, archival |
| Microsoft Word (DOCX) | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx | Editing in Microsoft Word |
| Rich Text Format | `application/rtf` | .rtf | Compatible with most word processors |
| Plain Text | `text/plain` | .txt | Simple text extraction |
| HTML | `text/html` | .html | Web publishing, email |
| EPUB | `application/epub+zip` | .epub | E-books, e-readers |
| OpenDocument Text | `application/vnd.oasis.opendocument.text` | .odt | LibreOffice, OpenOffice |

**Example:**
```bash
deno run ... download 1abc123 ./document.pdf --export-type application/pdf
deno run ... download 1abc123 ./document.docx --export-type application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### Google Sheets

| Format | MIME Type | Extension | Use Case |
|--------|-----------|-----------|----------|
| PDF | `application/pdf` | .pdf | Sharing, printing |
| Microsoft Excel (XLSX) | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | .xlsx | Editing in Microsoft Excel |
| CSV | `text/csv` | .csv | Data import/export, simple data |
| TSV | `text/tab-separated-values` | .tsv | Tab-delimited data |
| HTML | `text/html` | .html | Web publishing |
| OpenDocument Spreadsheet | `application/vnd.oasis.opendocument.spreadsheet` | .ods | LibreOffice Calc |

**Notes:**
- CSV/TSV exports only the first sheet by default
- Multiple sheets require separate exports or XLSX format
- Formulas are evaluated in CSV/TSV exports (values only)

**Example:**
```bash
deno run ... download 1abc123 ./spreadsheet.xlsx --export-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
deno run ... download 1abc123 ./data.csv --export-type text/csv
```

### Google Slides

| Format | MIME Type | Extension | Use Case |
|--------|-----------|-----------|----------|
| PDF | `application/pdf` | .pdf | Sharing, handouts |
| Microsoft PowerPoint (PPTX) | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | .pptx | Editing in Microsoft PowerPoint |
| Plain Text | `text/plain` | .txt | Speaker notes extraction |
| JPEG (PNG per slide) | `image/jpeg` | .jpg | Individual slide images |
| PNG (per slide) | `image/png` | .png | High-quality slide images |
| SVG (per slide) | `image/svg+xml` | .svg | Vector graphics |
| OpenDocument Presentation | `application/vnd.oasis.opendocument.presentation` | .odp | LibreOffice Impress |

**Notes:**
- Image exports create one file per slide
- For full presentation, use PPTX or PDF

**Example:**
```bash
deno run ... download 1abc123 ./presentation.pdf --export-type application/pdf
deno run ... download 1abc123 ./presentation.pptx --export-type application/vnd.openxmlformats-officedocument.presentationml.presentation
```

### Google Drawings

| Format | MIME Type | Extension | Use Case |
|--------|-----------|-----------|----------|
| PDF | `application/pdf` | .pdf | Sharing, printing |
| JPEG | `image/jpeg` | .jpg | Raster image |
| PNG | `image/png` | .png | Raster image with transparency |
| SVG | `image/svg+xml` | .svg | Vector graphics (scalable) |

**Example:**
```bash
deno run ... download 1abc123 ./drawing.svg --export-type image/svg+xml
deno run ... download 1abc123 ./drawing.png --export-type image/png
```

### Google Apps Script

| Format | MIME Type | Extension | Use Case |
|--------|-----------|-----------|----------|
| JSON | `application/vnd.google-apps.script+json` | .json | Script project export |

**Example:**
```bash
deno run ... download 1abc123 ./script.json --export-type application/vnd.google-apps.script+json
```

## Recommended Export Formats

### For Archival
- **Google Docs** → PDF
- **Google Sheets** → XLSX (preserves multiple sheets, formulas)
- **Google Slides** → PDF

### For Editing in Microsoft Office
- **Google Docs** → DOCX
- **Google Sheets** → XLSX
- **Google Slides** → PPTX

### For Data Processing
- **Google Sheets** → CSV (single sheet, simple data)
- **Google Sheets** → XLSX (multiple sheets, formulas)

### For Web Publishing
- **Google Docs** → HTML
- **Google Sheets** → HTML
- **Google Slides** → PDF or HTML

### For Open Source Software
- **Google Docs** → ODT (LibreOffice Writer)
- **Google Sheets** → ODS (LibreOffice Calc)
- **Google Slides** → ODP (LibreOffice Impress)

## Non-Google Workspace Files

Files that are not Google Workspace files (e.g., uploaded PDFs, images, Office files) can be downloaded directly without export:

```bash
# Download PDF (no export needed)
deno run ... download 1abc123 ./document.pdf

# Download image (no export needed)
deno run ... download 1abc123 ./photo.jpg

# Download Office file (no export needed)
deno run ... download 1abc123 ./spreadsheet.xlsx
```

## Format Conversion Best Practices

### Preserving Formatting

**High Fidelity (Best):**
1. PDF - Best for viewing, sharing, printing
2. Native Office formats (DOCX, XLSX, PPTX) - Best for editing
3. OpenDocument formats (ODT, ODS, ODP) - Open source alternative

**Lower Fidelity:**
1. HTML - Good for web, may lose some formatting
2. RTF - Compatible but limited formatting
3. Plain text - Loses all formatting

### Data Integrity

**Google Sheets to CSV/TSV:**
- ✅ Cell values preserved
- ❌ Formulas converted to values
- ❌ Multiple sheets require separate exports
- ❌ Formatting lost
- ❌ Charts/images not included

**Google Sheets to XLSX:**
- ✅ Cell values preserved
- ✅ Formulas preserved
- ✅ Multiple sheets included
- ✅ Most formatting preserved
- ✅ Charts included
- ⚠️  Some advanced features may not convert perfectly

### Large Files

For large files, consider:
- **PDF**: Good compression, widely compatible
- **XLSX**: Efficient for large datasets
- **CSV**: Smallest size but loses features

## Export Limitations

### Size Limits
- **Google Docs**: Up to 50 MB (Word format), 10 MB (PDF)
- **Google Sheets**: 5 million cells, 100 MB
- **Google Slides**: No specific limit

### Features Not Exported
Depending on format, these may not export:
- Comments and suggestions
- Version history
- Custom fonts (may be substituted)
- Some advanced formatting
- Add-ons and extensions
- Custom functions (Sheets)
- Real-time collaboration features

### Special Cases

**Google Forms:**
Cannot be exported directly. Export responses from linked spreadsheet instead.

**Google Sites:**
No export via Drive API. Use Google Takeout instead.

**Google My Maps:**
Limited export options via Drive API.

## Command Examples

### Export Google Doc as different formats

```bash
# As PDF
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./document.pdf --export-type application/pdf

# As Word document
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./document.docx \
  --export-type application/vnd.openxmlformats-officedocument.wordprocessingml.document

# As plain text
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./document.txt --export-type text/plain
```

### Export Google Sheet

```bash
# As Excel
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./spreadsheet.xlsx \
  --export-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# As CSV (first sheet only)
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./data.csv --export-type text/csv
```

### Export Google Slides

```bash
# As PowerPoint
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./presentation.pptx \
  --export-type application/vnd.openxmlformats-officedocument.presentationml.presentation

# As PDF
deno run --allow-net --allow-env --allow-read --allow-write \
  .claude/skills/google-drive/scripts/drive-client.ts \
  download 1abc123 ./presentation.pdf --export-type application/pdf
```

## Troubleshooting

**"Export not supported" error:**
- Verify the file is a Google Workspace file
- Check the MIME type combination is valid
- Ensure the export format is supported for that file type

**Large file export fails:**
- File may exceed size limits for that format
- Try a different format (e.g., CSV instead of XLSX)
- For very large files, may need to split or process differently

**Formatting issues:**
- Different formats have different fidelity
- Use native Office formats (DOCX, XLSX, PPTX) for best results
- PDF preserves visual appearance but isn't editable

**Multiple sheets in Google Sheets:**
- CSV/TSV only exports first sheet
- Use XLSX to export all sheets
- Or export each sheet separately to CSV

## Quick Reference

```bash
# Common export types (short names for reference)
PDF:    application/pdf
DOCX:   application/vnd.openxmlformats-officedocument.wordprocessingml.document
XLSX:   application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
PPTX:   application/vnd.openxmlformats-officedocument.presentationml.presentation
CSV:    text/csv
TXT:    text/plain
HTML:   text/html
RTF:    application/rtf
```
