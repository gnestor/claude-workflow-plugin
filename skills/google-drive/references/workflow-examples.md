# Google Drive Workflow Examples

Step-by-step examples for common Google Drive operations.

## Workflow 1: Find and Download a File

**User request**: "Download the latest budget spreadsheet"

**Process**:
1. Search for the file with query: `name contains 'budget' and mimeType='application/vnd.google-apps.spreadsheet'`
2. Extract file ID from results
3. Download as Excel using export type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
4. Confirm download location

## Workflow 2: Upload and Share a File

**User request**: "Upload this presentation and share it with the team"

**Process**:
1. Upload the file with a name
2. Extract file ID from upload response
3. Share with team members using appropriate role
4. Return shareable link

## Workflow 3: Organize Files into Folders

**User request**: "Move all PDFs from last month to the Archive folder"

**Process**:
1. Find Archive folder by searching for folder by name
2. Find PDFs from last month with date filter
3. Move each PDF to the Archive folder
4. Confirm number of files moved

## Workflow 4: Bulk Download Files

**User request**: "Download all images from the Photos folder"

**Process**:
1. Find Photos folder
2. List images in folder using parent filter and image MIME type
3. Download each image
4. Report download progress and totals
