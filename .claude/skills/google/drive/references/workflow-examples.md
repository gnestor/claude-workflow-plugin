# Google Drive Workflow Examples

Step-by-step examples for common Google Drive operations.

## Workflow 1: Find and Download a File

**User request**: "Download the latest budget spreadsheet"

**Process**:
1. Search for the file:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "name contains 'budget' and mimeType='application/vnd.google-apps.spreadsheet'" --order-by "modifiedTime desc" --limit 1
   ```
2. Extract file ID from results
3. Download as Excel:
   ```bash
   deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts download <file-id> ./budget.xlsx --export-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   ```
4. Confirm download location

## Workflow 2: Upload and Share a File

**User request**: "Upload this presentation and share it with the team"

**Process**:
1. Upload file:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts upload ./presentation.pptx --name "Q4 Presentation"
   ```
2. Extract file ID from upload response
3. Share with team members:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts share <file-id> team@company.com reader
   ```
4. Return shareable link

## Workflow 3: Organize Files into Folders

**User request**: "Move all PDFs from last month to the Archive folder"

**Process**:
1. Find Archive folder:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "name='Archive' and mimeType='application/vnd.google-apps.folder'"
   ```
2. Find PDFs from last month:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "mimeType='application/pdf' and modifiedTime > '2025-10-01T00:00:00' and modifiedTime < '2025-11-01T00:00:00'"
   ```
3. For each PDF, move to Archive folder:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts move <file-id> <archive-folder-id>
   ```
4. Confirm number of files moved

## Workflow 4: Bulk Download Files

**User request**: "Download all images from the Photos folder"

**Process**:
1. Find Photos folder:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "name='Photos' and mimeType='application/vnd.google-apps.folder'"
   ```
2. List images in folder:
   ```bash
   deno run --allow-net --allow-env --allow-read .claude/skills/google-drive/scripts/drive-client.ts search "'<folder-id>' in parents and mimeType contains 'image/'"
   ```
3. For each image, download:
   ```bash
   deno run --allow-net --allow-env --allow-read --allow-write .claude/skills/google-drive/scripts/drive-client.ts download <file-id> ./photos/<filename>
   ```
4. Report download progress and totals
