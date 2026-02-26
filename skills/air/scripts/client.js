#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { fetchAllPages } from '../../../lib/pagination.js';
import { success, error } from '../../../lib/output.js';
import { getCredentials } from '../../../lib/auth.js';
import { readFile } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';

const SERVICE = 'air';

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

function usage() {
  console.log(`Usage: client.js <command> [options]

Commands:
  test-auth                          Test API authentication
  list-assets                        List assets
    --boardId <id>                   Filter by board ID
    --limit <n>                      Max results per page
    --cursor <cursor>                Pagination cursor
    --search <query>                 Search query
  get-asset --id <id>                Get asset details
  delete-asset --id <id>             Delete an asset
  download-asset --id <id>           Download latest version of an asset
    --output <path>                  Output file path
  get-asset-versions --id <id>       List versions of an asset
  get-asset-version --id <id>        Get a specific asset version
    --versionId <vId>                Version ID
  add-asset-tag --id <id>            Add a tag to an asset version
    --versionId <vId>                Version ID
    --tagId <tagId>                  Tag ID
  remove-asset-tag --id <id>         Remove a tag from an asset version
    --versionId <vId>                Version ID
    --tagId <tagId>                  Tag ID
  set-custom-field --id <id>         Set custom field value on an asset
    --fieldId <fieldId>              Custom field ID
    --value <value>                  Field value
  get-asset-boards --id <id>         List boards containing an asset
  list-boards                        List all boards
    --limit <n>                      Max results per page
    --cursor <cursor>                Pagination cursor
  get-board --id <id>                Get board details
  create-board --name <name>         Create a new board
    --description <desc>             Board description
    --parentBoardId <id>             Parent board ID
  update-board --id <id>             Update a board
    --name <name>                    New name
    --description <desc>             New description
  delete-board --id <id>             Delete a board
  list-board-assets --id <id>        List assets in a board
    --recursive                      Include assets from sub-boards
  add-to-board --id <id>             Add assets to a board
    --assetIds <id1,id2,...>         Comma-separated asset IDs
  remove-from-board --id <id>        Remove an asset from a board
    --assetId <assetId>              Asset ID to remove
  list-board-guests --id <id>        List board guests
  add-board-guest --id <id>          Add a guest to a board
    --email <email>                  Guest email
    --roleId <roleId>               Role ID
  update-board-guest --id <id>       Update a board guest
    --guestId <guestId>             Guest ID
    --roleId <roleId>               New role ID
  remove-board-guest --id <id>       Remove a guest from a board
    --guestId <guestId>             Guest ID
  list-custom-fields                 List all custom fields
  get-custom-field --id <id>         Get custom field details
  create-custom-field --name <name>  Create a custom field
    --type <type>                    Field type
    --description <desc>             Field description
  update-custom-field --id <id>      Update a custom field
    --name <name>                    New name
    --description <desc>             New description
  delete-custom-field --id <id>      Delete a custom field
  add-custom-field-option --id <id>  Add option to a custom field
    --name <name>                    Option name
    --color <color>                  Option color
  update-custom-field-option --id <id>  Update a custom field option
    --valueId <valueId>             Option value ID
    --name <name>                    New name
    --color <color>                  New color
  delete-custom-field-option --id <id>  Delete a custom field option
    --valueId <valueId>             Option value ID
  list-tags                          List all tags
  create-tag --name <name>           Create a tag
    --color <color>                  Tag color
  update-tag --id <id>               Update a tag
    --name <name>                    New name
    --color <color>                  New color
  delete-tag --id <id>               Delete a tag
  upload-file --file <path>          Upload a local file
    --boardId <id>                   Target board ID
    --name <name>                    Override file name
  import-url --url <url>             Import from URL
    --boardId <id>                   Target board ID
    --name <name>                    Asset name
  get-import-status --id <id>        Check import status
  list-roles                         List available roles
  find-duplicates-by-name            Find assets with duplicate names
  find-duplicates-by-hash            Find assets with duplicate hashes
  check-duplicate --file <path>      Check if a local file is a duplicate
`);
}

// --- Commands ---

async function testAuth() {
  const result = await apiRequest(SERVICE, '/boards?limit=1');
  success('Authentication successful', result);
}

async function listAssets(flags) {
  const params = new URLSearchParams();
  if (flags.boardId) params.set('parentBoardId', flags.boardId);
  if (flags.limit) params.set('limit', flags.limit);
  if (flags.cursor) params.set('cursor', flags.cursor);
  if (flags.search) params.set('search', flags.search);
  const query = params.toString();
  const path = '/assets' + (query ? `?${query}` : '');
  const result = await apiRequest(SERVICE, path);
  success('Assets', result);
}

async function getAsset(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}`);
  success('Asset', result);
}

async function deleteAsset(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}`, { method: 'DELETE' });
  success('Asset deleted', result);
}

async function downloadAsset(flags) {
  if (!flags.id) return error('--id is required');
  // Get versions to find the latest
  const versions = await apiRequest(SERVICE, `/assets/${flags.id}/versions`);
  const versionList = versions.data || versions;
  if (!versionList || versionList.length === 0) {
    return error('No versions found for this asset');
  }
  const latestVersion = versionList[0];
  const vId = latestVersion.id;

  // Get download URL
  const download = await apiRequest(SERVICE, `/assets/${flags.id}/versions/${vId}/download`);
  const url = download.url || download.downloadUrl || download;

  if (!url || typeof url !== 'string') {
    return error('Could not retrieve download URL');
  }

  // Fetch the file
  const response = await fetch(url);
  if (!response.ok) {
    return error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // Determine output path
  const outputPath = flags.output || latestVersion.name || `asset-${flags.id}`;
  await writeFile(outputPath, buffer);
  success(`Downloaded to ${outputPath}`, { size: buffer.length, version: vId });
}

async function getAssetVersions(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}/versions`);
  success('Asset versions', result);
}

async function getAssetVersion(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.versionId) return error('--versionId is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}/versions/${flags.versionId}`);
  success('Asset version', result);
}

async function addAssetTag(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.versionId) return error('--versionId is required');
  if (!flags.tagId) return error('--tagId is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}/versions/${flags.versionId}/tags`, {
    method: 'POST',
    body: { tagId: flags.tagId },
  });
  success('Tag added', result);
}

async function removeAssetTag(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.versionId) return error('--versionId is required');
  if (!flags.tagId) return error('--tagId is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}/versions/${flags.versionId}/tags/${flags.tagId}`, {
    method: 'DELETE',
  });
  success('Tag removed', result);
}

async function setCustomField(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.fieldId) return error('--fieldId is required');
  if (flags.value === undefined) return error('--value is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}/customfields/${flags.fieldId}`, {
    method: 'PUT',
    body: { value: flags.value },
  });
  success('Custom field set', result);
}

async function getAssetBoards(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/assets/${flags.id}/boards`);
  success('Asset boards', result);
}

async function listBoards(flags) {
  const params = new URLSearchParams();
  if (flags.limit) params.set('limit', flags.limit);
  if (flags.cursor) params.set('cursor', flags.cursor);
  const query = params.toString();
  const path = '/boards' + (query ? `?${query}` : '');
  const result = await apiRequest(SERVICE, path);
  success('Boards', result);
}

async function getBoard(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}`);
  success('Board', result);
}

async function createBoard(flags) {
  if (!flags.name) return error('--name is required');
  const body = { name: flags.name };
  if (flags.description) body.description = flags.description;
  if (flags.parentBoardId) body.parentBoardId = flags.parentBoardId;
  const result = await apiRequest(SERVICE, '/boards', {
    method: 'POST',
    body,
  });
  success('Board created', result);
}

async function updateBoard(flags) {
  if (!flags.id) return error('--id is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.description) body.description = flags.description;
  if (Object.keys(body).length === 0) return error('Provide --name and/or --description');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}`, {
    method: 'PATCH',
    body,
  });
  success('Board updated', result);
}

async function deleteBoard(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}`, { method: 'DELETE' });
  success('Board deleted', result);
}

async function listBoardAssets(flags) {
  if (!flags.id) return error('--id is required');

  if (flags.recursive) {
    // Collect assets from this board and all sub-boards
    const allAssets = [];

    async function collectFromBoard(boardId) {
      const assets = await fetchAllPages(SERVICE, '/assets', {
        dataKey: 'data',
        cursorKey: 'pagination.cursor',
        pageSize: 100,
        params: { parentBoardId: boardId },
      });
      allAssets.push(...assets);

      // Get sub-boards
      const boardData = await apiRequest(SERVICE, `/boards/${boardId}`);
      const children = boardData.children || boardData.subBoards || [];
      for (const child of children) {
        const childId = typeof child === 'string' ? child : child.id;
        await collectFromBoard(childId);
      }
    }

    await collectFromBoard(flags.id);
    success(`Board assets (recursive, ${allAssets.length} total)`, allAssets);
  } else {
    const result = await apiRequest(SERVICE, `/assets?parentBoardId=${flags.id}`);
    success('Board assets', result);
  }
}

async function addToBoard(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.assetIds) return error('--assetIds is required (comma-separated)');
  const assetIds = flags.assetIds.split(',').map(s => s.trim());
  const result = await apiRequest(SERVICE, `/boards/${flags.id}/assets`, {
    method: 'POST',
    body: { assetIds },
  });
  success('Assets added to board', result);
}

async function removeFromBoard(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.assetId) return error('--assetId is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}/assets/${flags.assetId}`, {
    method: 'DELETE',
  });
  success('Asset removed from board', result);
}

async function listBoardGuests(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}/guests`);
  success('Board guests', result);
}

async function addBoardGuest(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.email) return error('--email is required');
  if (!flags.roleId) return error('--roleId is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}/guests`, {
    method: 'POST',
    body: { email: flags.email, roleId: flags.roleId },
  });
  success('Guest added', result);
}

async function updateBoardGuest(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.guestId) return error('--guestId is required');
  if (!flags.roleId) return error('--roleId is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}/guests/${flags.guestId}`, {
    method: 'PATCH',
    body: { roleId: flags.roleId },
  });
  success('Guest updated', result);
}

async function removeBoardGuest(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.guestId) return error('--guestId is required');
  const result = await apiRequest(SERVICE, `/boards/${flags.id}/guests/${flags.guestId}`, {
    method: 'DELETE',
  });
  success('Guest removed', result);
}

async function listCustomFields() {
  const result = await apiRequest(SERVICE, '/customfields');
  success('Custom fields', result);
}

async function getCustomField(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/customfields/${flags.id}`);
  success('Custom field', result);
}

async function createCustomField(flags) {
  if (!flags.name) return error('--name is required');
  if (!flags.type) return error('--type is required');
  const body = { name: flags.name, type: flags.type };
  if (flags.description) body.description = flags.description;
  const result = await apiRequest(SERVICE, '/customfields', {
    method: 'POST',
    body,
  });
  success('Custom field created', result);
}

async function updateCustomField(flags) {
  if (!flags.id) return error('--id is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.description) body.description = flags.description;
  if (Object.keys(body).length === 0) return error('Provide --name and/or --description');
  const result = await apiRequest(SERVICE, `/customfields/${flags.id}`, {
    method: 'PATCH',
    body,
  });
  success('Custom field updated', result);
}

async function deleteCustomField(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/customfields/${flags.id}`, { method: 'DELETE' });
  success('Custom field deleted', result);
}

async function addCustomFieldOption(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.name) return error('--name is required');
  const body = { name: flags.name };
  if (flags.color) body.color = flags.color;
  const result = await apiRequest(SERVICE, `/customfields/${flags.id}/values`, {
    method: 'POST',
    body,
  });
  success('Custom field option added', result);
}

async function updateCustomFieldOption(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.valueId) return error('--valueId is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.color) body.color = flags.color;
  if (Object.keys(body).length === 0) return error('Provide --name and/or --color');
  const result = await apiRequest(SERVICE, `/customfields/${flags.id}/values/${flags.valueId}`, {
    method: 'PATCH',
    body,
  });
  success('Custom field option updated', result);
}

async function deleteCustomFieldOption(flags) {
  if (!flags.id) return error('--id is required');
  if (!flags.valueId) return error('--valueId is required');
  const result = await apiRequest(SERVICE, `/customfields/${flags.id}/values/${flags.valueId}`, {
    method: 'DELETE',
  });
  success('Custom field option deleted', result);
}

async function listTags() {
  const result = await apiRequest(SERVICE, '/tags');
  success('Tags', result);
}

async function createTag(flags) {
  if (!flags.name) return error('--name is required');
  const body = { name: flags.name };
  if (flags.color) body.color = flags.color;
  const result = await apiRequest(SERVICE, '/tags', {
    method: 'POST',
    body,
  });
  success('Tag created', result);
}

async function updateTag(flags) {
  if (!flags.id) return error('--id is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.color) body.color = flags.color;
  if (Object.keys(body).length === 0) return error('Provide --name and/or --color');
  const result = await apiRequest(SERVICE, `/tags/${flags.id}`, {
    method: 'PATCH',
    body,
  });
  success('Tag updated', result);
}

async function deleteTag(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/tags/${flags.id}`, { method: 'DELETE' });
  success('Tag deleted', result);
}

async function uploadFile(flags) {
  if (!flags.file) return error('--file is required');
  const filePath = flags.file;
  const creds = await getCredentials(SERVICE);
  const fileContent = await readFile(filePath);
  const fileName = flags.name || basename(filePath);

  const formData = new FormData();
  formData.append('file', new Blob([fileContent]), fileName);
  if (flags.boardId) formData.append('boardId', flags.boardId);

  const headers = { ...creds.headers };
  delete headers['Content-Type'];

  const res = await fetch(`${creds.baseUrl}/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    return error(`Upload failed: ${res.status} ${res.statusText} - ${text}`);
  }

  const result = await res.json();
  success('File uploaded', result);
}

async function importUrl(flags) {
  if (!flags.url) return error('--url is required');
  const body = { url: flags.url };
  if (flags.boardId) body.boardId = flags.boardId;
  if (flags.name) body.name = flags.name;
  const result = await apiRequest(SERVICE, '/imports', {
    method: 'POST',
    body,
  });
  success('Import started', result);
}

async function getImportStatus(flags) {
  if (!flags.id) return error('--id is required');
  const result = await apiRequest(SERVICE, `/imports/${flags.id}/status`);
  success('Import status', result);
}

async function listRoles() {
  const result = await apiRequest(SERVICE, '/roles');
  success('Roles', result);
}

async function findDuplicatesByName() {
  const assets = await fetchAllPages(SERVICE, '/assets', {
    dataKey: 'data',
    cursorKey: 'pagination.cursor',
    pageSize: 100,
  });

  const byName = {};
  for (const asset of assets) {
    const name = asset.name || '(unnamed)';
    if (!byName[name]) byName[name] = [];
    byName[name].push(asset);
  }

  const duplicates = {};
  for (const [name, group] of Object.entries(byName)) {
    if (group.length > 1) {
      duplicates[name] = group.map(a => ({ id: a.id, name: a.name, createdAt: a.createdAt }));
    }
  }

  const dupeCount = Object.keys(duplicates).length;
  if (dupeCount === 0) {
    success('No duplicates found by name', { totalAssets: assets.length });
  } else {
    success(`Found ${dupeCount} duplicate name(s)`, duplicates);
  }
}

async function findDuplicatesByHash() {
  const assets = await fetchAllPages(SERVICE, '/assets', {
    dataKey: 'data',
    cursorKey: 'pagination.cursor',
    pageSize: 100,
  });

  const byHash = {};
  for (const asset of assets) {
    const hash = asset.hash || asset.fileHash || asset.sha256;
    if (!hash) continue;
    if (!byHash[hash]) byHash[hash] = [];
    byHash[hash].push(asset);
  }

  const duplicates = {};
  for (const [hash, group] of Object.entries(byHash)) {
    if (group.length > 1) {
      duplicates[hash] = group.map(a => ({ id: a.id, name: a.name, createdAt: a.createdAt }));
    }
  }

  const dupeCount = Object.keys(duplicates).length;
  if (dupeCount === 0) {
    success('No duplicates found by hash', { totalAssets: assets.length });
  } else {
    success(`Found ${dupeCount} duplicate hash(es)`, duplicates);
  }
}

async function checkDuplicate(flags) {
  if (!flags.file) return error('--file is required');
  const fileContent = await readFile(flags.file);
  const localHash = createHash('sha256').update(fileContent).digest('hex');
  const fileName = basename(flags.file);

  const assets = await fetchAllPages(SERVICE, '/assets', {
    dataKey: 'data',
    cursorKey: 'pagination.cursor',
    pageSize: 100,
  });

  const hashMatches = assets.filter(a => {
    const assetHash = a.hash || a.fileHash || a.sha256;
    return assetHash && assetHash.toLowerCase() === localHash.toLowerCase();
  });

  const nameMatches = assets.filter(a => a.name === fileName);

  if (hashMatches.length > 0) {
    success('Duplicate found (hash match)', {
      localFile: flags.file,
      localHash,
      matches: hashMatches.map(a => ({ id: a.id, name: a.name })),
    });
  } else if (nameMatches.length > 0) {
    success('Possible duplicate (name match, hash differs)', {
      localFile: flags.file,
      localHash,
      nameMatches: nameMatches.map(a => ({ id: a.id, name: a.name, hash: a.hash || a.fileHash || a.sha256 })),
    });
  } else {
    success('No duplicate found', { localFile: flags.file, localHash, totalAssetsChecked: assets.length });
  }
}

// --- Main ---

const COMMANDS = {
  'test-auth': testAuth,
  'list-assets': listAssets,
  'get-asset': getAsset,
  'delete-asset': deleteAsset,
  'download-asset': downloadAsset,
  'get-asset-versions': getAssetVersions,
  'get-asset-version': getAssetVersion,
  'add-asset-tag': addAssetTag,
  'remove-asset-tag': removeAssetTag,
  'set-custom-field': setCustomField,
  'get-asset-boards': getAssetBoards,
  'list-boards': listBoards,
  'get-board': getBoard,
  'create-board': createBoard,
  'update-board': updateBoard,
  'delete-board': deleteBoard,
  'list-board-assets': listBoardAssets,
  'add-to-board': addToBoard,
  'remove-from-board': removeFromBoard,
  'list-board-guests': listBoardGuests,
  'add-board-guest': addBoardGuest,
  'update-board-guest': updateBoardGuest,
  'remove-board-guest': removeBoardGuest,
  'list-custom-fields': listCustomFields,
  'get-custom-field': getCustomField,
  'create-custom-field': createCustomField,
  'update-custom-field': updateCustomField,
  'delete-custom-field': deleteCustomField,
  'add-custom-field-option': addCustomFieldOption,
  'update-custom-field-option': updateCustomFieldOption,
  'delete-custom-field-option': deleteCustomFieldOption,
  'list-tags': listTags,
  'create-tag': createTag,
  'update-tag': updateTag,
  'delete-tag': deleteTag,
  'upload-file': uploadFile,
  'import-url': importUrl,
  'get-import-status': getImportStatus,
  'list-roles': listRoles,
  'find-duplicates-by-name': findDuplicatesByName,
  'find-duplicates-by-hash': findDuplicatesByHash,
  'check-duplicate': checkDuplicate,
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    usage();
    process.exit(0);
  }

  const handler = COMMANDS[command];
  if (!handler) {
    error(`Unknown command: ${command}`);
    console.log('Run with --help to see available commands.');
    process.exit(1);
  }

  const flags = parseFlags(args.slice(1));

  try {
    await handler(flags);
  } catch (err) {
    error(`${command} failed: ${err.message}`);
    process.exit(1);
  }
}

main();
