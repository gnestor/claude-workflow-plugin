#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write
/**
 * Google Drive API Client for Claude Code
 *
 * Provides access to Google Drive files and folders via the Drive API v3
 * Uses shared OAuth2 authentication from google.ts
 */

import "@std/dotenv/load";
import { getAccessToken, authenticate, checkOAuthConfig } from "../../scripts/google.ts";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
];

/**
 * Make authenticated request to Google Drive API
 */
async function driveRequest(path: string, options: RequestInit = {}): Promise<any> {
  const accessToken = await getAccessToken(SCOPES);
  const url = `${DRIVE_API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Drive API error: ${error}`);
  }

  return response.json();
}

/**
 * Search for files using Drive query syntax
 */
async function searchFiles(
  query: string,
  options: {
    limit?: number;
    orderBy?: string;
    fields?: string;
  } = {}
): Promise<any> {
  const params = new URLSearchParams();
  params.set("q", query);

  if (options.limit) {
    params.set("pageSize", options.limit.toString());
  }

  if (options.orderBy) {
    params.set("orderBy", options.orderBy);
  }

  const fields = options.fields || "files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,owners,parents,shared,starred)";
  params.set("fields", fields);

  return driveRequest(`/files?${params.toString()}`);
}

/**
 * List files in a folder
 */
async function listFiles(
  folderId: string = "root",
  options: {
    limit?: number;
    orderBy?: string;
  } = {}
): Promise<any> {
  const query = `'${folderId}' in parents and trashed = false`;
  return searchFiles(query, options);
}

/**
 * Get file metadata
 */
async function getFile(fileId: string, fields?: string): Promise<any> {
  const params = new URLSearchParams();
  const defaultFields = "id,name,mimeType,description,starred,trashed,createdTime,modifiedTime,size,webViewLink,webContentLink,owners,parents,permissions,shared,sharingUser";
  params.set("fields", fields || defaultFields);

  return driveRequest(`/files/${fileId}?${params.toString()}`);
}

/**
 * Download file content
 */
async function downloadFile(
  fileId: string,
  outputPath: string,
  exportMimeType?: string
): Promise<void> {
  const accessToken = await getAccessToken(SCOPES);

  // Determine URL based on whether we're exporting or downloading
  const url = exportMimeType
    ? `${DRIVE_API_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`
    : `${DRIVE_API_BASE}/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Download failed: ${error}`);
  }

  const content = await response.arrayBuffer();
  await Deno.writeFile(outputPath, new Uint8Array(content));
}

/**
 * Upload file
 */
async function uploadFile(
  filePath: string,
  options: {
    name?: string;
    parentId?: string;
    mimeType?: string;
  } = {}
): Promise<any> {
  const accessToken = await getAccessToken(SCOPES);

  // Read file content
  const fileContent = await Deno.readFile(filePath);

  // Determine filename
  const fileName = options.name || filePath.split("/").pop() || "untitled";

  // Prepare metadata
  const metadata: any = {
    name: fileName,
  };

  if (options.parentId) {
    metadata.parents = [options.parentId];
  }

  if (options.mimeType) {
    metadata.mimeType = options.mimeType;
  }

  // Create multipart upload
  const boundary = "-------boundary";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata);

  const filePart = delimiter +
    `Content-Type: ${options.mimeType || "application/octet-stream"}\r\n\r\n`;

  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataPart);
  const filePartBytes = encoder.encode(filePart);
  const closeDelimiterBytes = encoder.encode(closeDelimiter);

  const body = new Uint8Array(
    metadataBytes.length +
    filePartBytes.length +
    fileContent.length +
    closeDelimiterBytes.length
  );

  let offset = 0;
  body.set(metadataBytes, offset);
  offset += metadataBytes.length;
  body.set(filePartBytes, offset);
  offset += filePartBytes.length;
  body.set(fileContent, offset);
  offset += fileContent.length;
  body.set(closeDelimiterBytes, offset);

  const response = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  return response.json();
}

/**
 * Update file content
 */
async function updateFile(
  fileId: string,
  filePath: string,
  mimeType?: string
): Promise<any> {
  const accessToken = await getAccessToken(SCOPES);
  const fileContent = await Deno.readFile(filePath);

  const response = await fetch(`${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: fileContent,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update failed: ${error}`);
  }

  return response.json();
}

/**
 * Update file metadata
 */
async function updateMetadata(fileId: string, metadata: any): Promise<any> {
  return driveRequest(`/files/${fileId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
}

/**
 * Create folder
 */
async function createFolder(name: string, parentId?: string): Promise<any> {
  const metadata: any = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentId) {
    metadata.parents = [parentId];
  }

  return driveRequest("/files", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
}

/**
 * Move file to different folder
 */
async function moveFile(
  fileId: string,
  newParentId: string,
  removeParents?: string
): Promise<any> {
  const params = new URLSearchParams();
  params.set("addParents", newParentId);

  if (removeParents !== undefined && removeParents !== "") {
    params.set("removeParents", removeParents);
  } else if (removeParents !== "") {
    // Get current parents to remove
    const file = await getFile(fileId, "parents");
    if (file.parents && file.parents.length > 0) {
      params.set("removeParents", file.parents.join(","));
    }
  }

  return driveRequest(`/files/${fileId}?${params.toString()}`, {
    method: "PATCH",
  });
}

/**
 * Copy file
 */
async function copyFile(
  fileId: string,
  options: {
    name?: string;
    parentId?: string;
  } = {}
): Promise<any> {
  const metadata: any = {};

  if (options.name) {
    metadata.name = options.name;
  }

  if (options.parentId) {
    metadata.parents = [options.parentId];
  }

  return driveRequest(`/files/${fileId}/copy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
}

/**
 * Trash file (soft delete)
 */
async function trashFile(fileId: string): Promise<any> {
  return updateMetadata(fileId, { trashed: true });
}

/**
 * Permanently delete file
 */
async function deleteFile(fileId: string): Promise<void> {
  const accessToken = await getAccessToken(SCOPES);
  const url = `${DRIVE_API_BASE}/files/${fileId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed: ${error}`);
  }
}

/**
 * Create permission (share file)
 */
async function createPermission(
  fileId: string,
  options: {
    emailAddress?: string;
    role: string;
    type: string;
  }
): Promise<any> {
  const permission: any = {
    role: options.role,
    type: options.type,
  };

  if (options.emailAddress) {
    permission.emailAddress = options.emailAddress;
  }

  return driveRequest(`/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(permission),
  });
}

/**
 * List permissions
 */
async function listPermissions(fileId: string): Promise<any> {
  return driveRequest(`/files/${fileId}/permissions?fields=permissions(id,type,role,emailAddress,displayName)`);
}

/**
 * Delete permission
 */
async function deletePermission(fileId: string, permissionId: string): Promise<void> {
  const accessToken = await getAccessToken(SCOPES);
  const url = `${DRIVE_API_BASE}/files/${fileId}/permissions/${permissionId}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete permission failed: ${error}`);
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes?: string): string {
  if (!bytes) return "N/A";
  const size = parseInt(bytes);
  if (isNaN(size)) return "N/A";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let fileSize = size;

  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024;
    unitIndex++;
  }

  return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format file for display
 */
function formatFile(file: any): any {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: formatSize(file.size),
    created: file.createdTime,
    modified: file.modifiedTime,
    webViewLink: file.webViewLink,
    owners: file.owners?.map((o: any) => o.emailAddress || o.displayName),
    shared: file.shared,
    starred: file.starred,
  };
}

/**
 * CLI Command Handlers
 */

async function searchCLI(query: string, limit?: number, orderBy?: string): Promise<void> {
  const result = await searchFiles(query, { limit, orderBy });

  console.log(JSON.stringify({
    totalFiles: result.files?.length || 0,
    files: result.files?.map(formatFile) || []
  }, null, 2));
}

async function listCLI(folderId?: string, limit?: number, orderBy?: string): Promise<void> {
  const result = await listFiles(folderId || "root", { limit, orderBy });

  console.log(JSON.stringify({
    folderId: folderId || "root",
    totalFiles: result.files?.length || 0,
    files: result.files?.map(formatFile) || []
  }, null, 2));
}

async function getCLI(fileId: string): Promise<void> {
  const file = await getFile(fileId);
  console.log(JSON.stringify(formatFile(file), null, 2));
}

async function downloadCLI(fileId: string, outputPath: string, exportType?: string): Promise<void> {
  await downloadFile(fileId, outputPath, exportType);
  console.log(JSON.stringify({
    success: true,
    message: `File downloaded to ${outputPath}`,
    path: outputPath
  }, null, 2));
}

async function uploadCLI(
  filePath: string,
  name?: string,
  parentId?: string,
  mimeType?: string
): Promise<void> {
  const result = await uploadFile(filePath, { name, parentId, mimeType });
  console.log(JSON.stringify({
    success: true,
    message: "File uploaded successfully",
    file: formatFile(result)
  }, null, 2));
}

async function updateCLI(fileId: string, filePath: string, mimeType?: string): Promise<void> {
  const result = await updateFile(fileId, filePath, mimeType);
  console.log(JSON.stringify({
    success: true,
    message: "File updated successfully",
    file: formatFile(result)
  }, null, 2));
}

async function updateMetadataCLI(fileId: string, metadataJson: string): Promise<void> {
  const metadata = JSON.parse(metadataJson);
  const result = await updateMetadata(fileId, metadata);
  console.log(JSON.stringify({
    success: true,
    message: "File metadata updated successfully",
    file: formatFile(result)
  }, null, 2));
}

async function createFolderCLI(name: string, parentId?: string): Promise<void> {
  const result = await createFolder(name, parentId);
  console.log(JSON.stringify({
    success: true,
    message: "Folder created successfully",
    folder: formatFile(result)
  }, null, 2));
}

async function moveCLI(fileId: string, newParentId: string, removeParents?: string): Promise<void> {
  const result = await moveFile(fileId, newParentId, removeParents);
  console.log(JSON.stringify({
    success: true,
    message: "File moved successfully",
    file: formatFile(result)
  }, null, 2));
}

async function copyCLI(fileId: string, name?: string, parentId?: string): Promise<void> {
  const result = await copyFile(fileId, { name, parentId });
  console.log(JSON.stringify({
    success: true,
    message: "File copied successfully",
    file: formatFile(result)
  }, null, 2));
}

async function trashCLI(fileId: string): Promise<void> {
  const result = await trashFile(fileId);
  console.log(JSON.stringify({
    success: true,
    message: "File moved to trash",
    file: formatFile(result)
  }, null, 2));
}

async function deleteCLI(fileId: string): Promise<void> {
  await deleteFile(fileId);
  console.log(JSON.stringify({
    success: true,
    message: "File permanently deleted"
  }, null, 2));
}

async function shareCLI(
  fileId: string,
  email: string,
  role: string,
  type: string
): Promise<void> {
  const result = await createPermission(fileId, {
    emailAddress: email || undefined,
    role,
    type,
  });
  console.log(JSON.stringify({
    success: true,
    message: "Permission added successfully",
    permission: result
  }, null, 2));
}

async function listPermissionsCLI(fileId: string): Promise<void> {
  const result = await listPermissions(fileId);
  console.log(JSON.stringify(result, null, 2));
}

async function removePermissionCLI(fileId: string, permissionId: string): Promise<void> {
  await deletePermission(fileId, permissionId);
  console.log(JSON.stringify({
    success: true,
    message: "Permission removed successfully"
  }, null, 2));
}

/**
 * CLI Main Handler
 */
async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error(`
Google Drive API Client

Usage:
  drive-client.ts <command> [options]

Commands:
  # Authentication
  auth                                     Authenticate with Google OAuth

  # Search & List
  search <query> [--limit N] [--order-by FIELD]
                                          Search files with Drive query syntax
  list [folder-id] [--limit N] [--order-by FIELD]
                                          List files in folder (default: root)
  get <file-id>                           Get file metadata

  # Download
  download <file-id> <output-path> [--export-type MIME]
                                          Download file
  export <file-id> <mime-type> <output-path>
                                          Export Google Workspace file

  # Upload & Update
  upload <file-path> [--name NAME] [--parent ID] [--mime-type TYPE]
                                          Upload file
  update <file-id> <file-path> [--mime-type TYPE]
                                          Update file content
  update-metadata <file-id> <json>        Update file metadata

  # Organize
  create-folder <name> [--parent ID]      Create folder
  move <file-id> <new-parent-id> [--remove-parents IDS]
                                          Move file to folder
  copy <file-id> [--name NAME] [--parent ID]
                                          Copy file

  # Delete
  trash <file-id>                         Move file to trash
  delete <file-id>                        Permanently delete file

  # Share
  share <file-id> <email> <role> [--type TYPE]
                                          Add permission to file
  list-permissions <file-id>              List file permissions
  remove-permission <file-id> <permission-id>
                                          Remove permission

Arguments:
  <query>         Drive search query (e.g., "name contains 'budget'")
  <file-id>       Google Drive file ID
  <folder-id>     Google Drive folder ID
  <output-path>   Local path to save file
  <file-path>     Local path to file to upload
  <json>          JSON object with metadata fields
  <email>         Email address to share with
  <role>          Permission role: reader, writer, commenter, owner
  <mime-type>     MIME type for export/upload

Options:
  --limit N                Maximum number of results (default: 20)
  --order-by FIELD        Sort field (e.g., "name", "modifiedTime desc")
  --export-type MIME      Export format for Google Workspace files
  --name NAME             Custom name for file
  --parent ID             Parent folder ID
  --mime-type TYPE        MIME type for upload
  --type TYPE             Permission type: user, group, domain, anyone
  --remove-parents IDS    Parent IDs to remove (comma-separated)

Environment Variables:
  GOOGLE_CLIENT_ID       OAuth client ID
  GOOGLE_CLIENT_SECRET   OAuth client secret
  GOOGLE_REFRESH_TOKEN   OAuth refresh token (obtained via 'auth' command)

Examples:
  # Authenticate
  drive-client.ts auth

  # Search
  drive-client.ts search "name contains 'budget'"
  drive-client.ts search "mimeType='application/pdf'" --limit 10

  # List files
  drive-client.ts list
  drive-client.ts list 1abc123folder --order-by "modifiedTime desc"

  # Download
  drive-client.ts download 1abc123 ./document.pdf
  drive-client.ts download 1abc123 ./doc.pdf --export-type application/pdf

  # Upload
  drive-client.ts upload ./file.pdf
  drive-client.ts upload ./report.xlsx --name "Q4 Report" --parent 1abc123

  # Share
  drive-client.ts share 1abc123 user@example.com reader
  drive-client.ts share 1abc123 "" reader --type anyone
    `);
    Deno.exit(1);
  }

  const command = args[0];

  try {
    switch (command) {
      case "auth": {
        const result = await authenticate(SCOPES, "Google Drive");
        if (!result.success) {
          console.error(`Error: ${result.error}`);
          Deno.exit(1);
        }
        break;
      }

      case "search": {
        if (args.length < 2) {
          console.error("Error: Missing search query");
          Deno.exit(1);
        }
        const query = args[1];
        const limitIndex = args.indexOf("--limit");
        const limit = limitIndex !== -1 && args[limitIndex + 1]
          ? parseInt(args[limitIndex + 1])
          : 20;
        const orderByIndex = args.indexOf("--order-by");
        const orderBy = orderByIndex !== -1 && args[orderByIndex + 1]
          ? args[orderByIndex + 1]
          : undefined;
        await searchCLI(query, limit, orderBy);
        break;
      }

      case "list": {
        const folderId = args[1] && !args[1].startsWith("--") ? args[1] : undefined;
        const limitIndex = args.indexOf("--limit");
        const limit = limitIndex !== -1 && args[limitIndex + 1]
          ? parseInt(args[limitIndex + 1])
          : 20;
        const orderByIndex = args.indexOf("--order-by");
        const orderBy = orderByIndex !== -1 && args[orderByIndex + 1]
          ? args[orderByIndex + 1]
          : undefined;
        await listCLI(folderId, limit, orderBy);
        break;
      }

      case "get": {
        if (args.length < 2) {
          console.error("Error: Missing file ID");
          Deno.exit(1);
        }
        await getCLI(args[1]);
        break;
      }

      case "download":
      case "export": {
        if (args.length < 3) {
          console.error("Error: Missing file ID or output path");
          Deno.exit(1);
        }
        const fileId = args[1];
        let outputPath: string;
        let exportType: string | undefined;

        if (command === "export") {
          // export command: file-id mime-type output-path
          exportType = args[2];
          outputPath = args[3];
        } else {
          // download command: file-id output-path [--export-type mime]
          outputPath = args[2];
          const exportTypeIndex = args.indexOf("--export-type");
          exportType = exportTypeIndex !== -1 && args[exportTypeIndex + 1]
            ? args[exportTypeIndex + 1]
            : undefined;
        }

        await downloadCLI(fileId, outputPath, exportType);
        break;
      }

      case "upload": {
        if (args.length < 2) {
          console.error("Error: Missing file path");
          Deno.exit(1);
        }
        const filePath = args[1];
        const nameIndex = args.indexOf("--name");
        const name = nameIndex !== -1 && args[nameIndex + 1]
          ? args[nameIndex + 1]
          : undefined;
        const parentIndex = args.indexOf("--parent");
        const parentId = parentIndex !== -1 && args[parentIndex + 1]
          ? args[parentIndex + 1]
          : undefined;
        const mimeIndex = args.indexOf("--mime-type");
        const mimeType = mimeIndex !== -1 && args[mimeIndex + 1]
          ? args[mimeIndex + 1]
          : undefined;
        await uploadCLI(filePath, name, parentId, mimeType);
        break;
      }

      case "update": {
        if (args.length < 3) {
          console.error("Error: Missing file ID or file path");
          Deno.exit(1);
        }
        const fileId = args[1];
        const filePath = args[2];
        const mimeIndex = args.indexOf("--mime-type");
        const mimeType = mimeIndex !== -1 && args[mimeIndex + 1]
          ? args[mimeIndex + 1]
          : undefined;
        await updateCLI(fileId, filePath, mimeType);
        break;
      }

      case "update-metadata": {
        if (args.length < 3) {
          console.error("Error: Missing file ID or metadata JSON");
          Deno.exit(1);
        }
        await updateMetadataCLI(args[1], args[2]);
        break;
      }

      case "create-folder": {
        if (args.length < 2) {
          console.error("Error: Missing folder name");
          Deno.exit(1);
        }
        const name = args[1];
        const parentIndex = args.indexOf("--parent");
        const parentId = parentIndex !== -1 && args[parentIndex + 1]
          ? args[parentIndex + 1]
          : undefined;
        await createFolderCLI(name, parentId);
        break;
      }

      case "move": {
        if (args.length < 3) {
          console.error("Error: Missing file ID or new parent ID");
          Deno.exit(1);
        }
        const fileId = args[1];
        const newParentId = args[2];
        const removeIndex = args.indexOf("--remove-parents");
        const removeParents = removeIndex !== -1 && args[removeIndex + 1]
          ? args[removeIndex + 1]
          : undefined;
        await moveCLI(fileId, newParentId, removeParents);
        break;
      }

      case "copy": {
        if (args.length < 2) {
          console.error("Error: Missing file ID");
          Deno.exit(1);
        }
        const fileId = args[1];
        const nameIndex = args.indexOf("--name");
        const name = nameIndex !== -1 && args[nameIndex + 1]
          ? args[nameIndex + 1]
          : undefined;
        const parentIndex = args.indexOf("--parent");
        const parentId = parentIndex !== -1 && args[parentIndex + 1]
          ? args[parentIndex + 1]
          : undefined;
        await copyCLI(fileId, name, parentId);
        break;
      }

      case "trash": {
        if (args.length < 2) {
          console.error("Error: Missing file ID");
          Deno.exit(1);
        }
        await trashCLI(args[1]);
        break;
      }

      case "delete": {
        if (args.length < 2) {
          console.error("Error: Missing file ID");
          Deno.exit(1);
        }
        await deleteCLI(args[1]);
        break;
      }

      case "share": {
        if (args.length < 4) {
          console.error("Error: Missing file ID, email, or role");
          Deno.exit(1);
        }
        const fileId = args[1];
        const email = args[2];
        const role = args[3];
        const typeIndex = args.indexOf("--type");
        const type = typeIndex !== -1 && args[typeIndex + 1]
          ? args[typeIndex + 1]
          : "user";
        await shareCLI(fileId, email, role, type);
        break;
      }

      case "list-permissions": {
        if (args.length < 2) {
          console.error("Error: Missing file ID");
          Deno.exit(1);
        }
        await listPermissionsCLI(args[1]);
        break;
      }

      case "remove-permission": {
        if (args.length < 3) {
          console.error("Error: Missing file ID or permission ID");
          Deno.exit(1);
        }
        await removePermissionCLI(args[1], args[2]);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
