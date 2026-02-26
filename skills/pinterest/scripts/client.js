#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'pinterest';

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

function buildQuery(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

// --- Commands ---

async function testAuth() {
  const result = await apiRequest(SERVICE, '/user_account');
  return result;
}

async function getProfile() {
  const result = await apiRequest(SERVICE, '/user_account');
  return result;
}

async function getAnalytics(flags) {
  if (!flags['start-date']) throw new Error('--start-date is required');
  if (!flags['end-date']) throw new Error('--end-date is required');
  const result = await apiRequest(SERVICE, `/user_account/analytics${buildQuery({
    start_date: flags['start-date'],
    end_date: flags['end-date'],
    metric_types: 'IMPRESSION,PIN_CLICK,SAVE,OUTBOUND_CLICK',
  })}`);
  return result;
}

async function topPins(flags) {
  if (!flags['start-date']) throw new Error('--start-date is required');
  if (!flags['end-date']) throw new Error('--end-date is required');
  const result = await apiRequest(SERVICE, `/user_account/top_pins_analytics${buildQuery({
    start_date: flags['start-date'],
    end_date: flags['end-date'],
    sort_by: 'IMPRESSION',
    metric_types: 'IMPRESSION,PIN_CLICK,SAVE',
  })}`);
  return result;
}

async function listFollowers() {
  const result = await apiRequest(SERVICE, '/user_account/followers');
  return result;
}

async function listFollowing() {
  const result = await apiRequest(SERVICE, '/user_account/following/users');
  return result;
}

async function listBoards(flags) {
  const params = {};
  if (flags.limit) params.page_size = flags.limit;
  if (flags.bookmark) params.bookmark = flags.bookmark;
  const result = await apiRequest(SERVICE, `/boards${buildQuery(params)}`);
  return result;
}

async function getBoard(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}`);
  return result;
}

async function createBoard(flags) {
  if (!flags.name) throw new Error('--name is required');
  const body = { name: flags.name };
  if (flags.description) body.description = flags.description;
  if (flags.privacy) body.privacy = flags.privacy;
  const result = await apiRequest(SERVICE, '/boards', {
    method: 'POST',
    body,
  });
  return result;
}

async function updateBoard(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const body = {};
  if (flags.name) body.name = flags.name;
  if (flags.description) body.description = flags.description;
  if (flags.privacy) body.privacy = flags.privacy;
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}`, {
    method: 'PATCH',
    body,
  });
  return result;
}

async function deleteBoard(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}`, {
    method: 'DELETE',
  });
  return result;
}

async function listBoardPins(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const params = {};
  if (flags.limit) params.page_size = flags.limit;
  if (flags.bookmark) params.bookmark = flags.bookmark;
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}/pins${buildQuery(params)}`);
  return result;
}

async function listSections(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}/sections`);
  return result;
}

async function createSection(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  if (!flags.name) throw new Error('--name is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}/sections`, {
    method: 'POST',
    body: { name: flags.name },
  });
  return result;
}

async function updateSection(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  if (!flags['section-id']) throw new Error('--section-id is required');
  if (!flags.name) throw new Error('--name is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}/sections/${flags['section-id']}`, {
    method: 'PATCH',
    body: { name: flags.name },
  });
  return result;
}

async function deleteSection(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  if (!flags['section-id']) throw new Error('--section-id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}/sections/${flags['section-id']}`, {
    method: 'DELETE',
  });
  return result;
}

async function listSectionPins(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  if (!flags['section-id']) throw new Error('--section-id is required');
  const result = await apiRequest(SERVICE, `/boards/${flags['board-id']}/sections/${flags['section-id']}/pins`);
  return result;
}

async function listPins(flags) {
  const params = {};
  if (flags.limit) params.page_size = flags.limit;
  if (flags.bookmark) params.bookmark = flags.bookmark;
  const result = await apiRequest(SERVICE, `/pins${buildQuery(params)}`);
  return result;
}

async function getPin(flags) {
  if (!flags['pin-id']) throw new Error('--pin-id is required');
  const result = await apiRequest(SERVICE, `/pins/${flags['pin-id']}`);
  return result;
}

async function createPin(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const body = { board_id: flags['board-id'] };
  if (flags.title) body.title = flags.title;
  if (flags.description) body.description = flags.description;
  if (flags.link) body.link = flags.link;
  if (flags['image-url']) {
    body.media_source = {
      source_type: 'image_url',
      url: flags['image-url'],
    };
  }
  const result = await apiRequest(SERVICE, '/pins', {
    method: 'POST',
    body,
  });
  return result;
}

async function updatePin(flags) {
  if (!flags['pin-id']) throw new Error('--pin-id is required');
  const body = {};
  if (flags.title) body.title = flags.title;
  if (flags.description) body.description = flags.description;
  if (flags.link) body.link = flags.link;
  if (flags['board-id']) body.board_id = flags['board-id'];
  const result = await apiRequest(SERVICE, `/pins/${flags['pin-id']}`, {
    method: 'PATCH',
    body,
  });
  return result;
}

async function deletePin(flags) {
  if (!flags['pin-id']) throw new Error('--pin-id is required');
  const result = await apiRequest(SERVICE, `/pins/${flags['pin-id']}`, {
    method: 'DELETE',
  });
  return result;
}

async function pinAnalytics(flags) {
  if (!flags['pin-id']) throw new Error('--pin-id is required');
  if (!flags['start-date']) throw new Error('--start-date is required');
  if (!flags['end-date']) throw new Error('--end-date is required');
  const result = await apiRequest(SERVICE, `/pins/${flags['pin-id']}/analytics${buildQuery({
    start_date: flags['start-date'],
    end_date: flags['end-date'],
    metric_types: 'IMPRESSION,PIN_CLICK,SAVE,OUTBOUND_CLICK',
  })}`);
  return result;
}

async function savePin(flags) {
  if (!flags['pin-id']) throw new Error('--pin-id is required');
  if (!flags['board-id']) throw new Error('--board-id is required');
  const body = { board_id: flags['board-id'] };
  if (flags['board-section-id']) body.board_section_id = flags['board-section-id'];
  const result = await apiRequest(SERVICE, `/pins/${flags['pin-id']}/save`, {
    method: 'POST',
    body,
  });
  return result;
}

async function searchBoards(flags) {
  if (!flags.query) throw new Error('--query is required');
  const boards = await apiRequest(SERVICE, '/boards');
  const items = boards.items || boards.data || boards;
  const query = flags.query.toLowerCase();
  const filtered = (Array.isArray(items) ? items : []).filter((b) => {
    const name = (b.name || '').toLowerCase();
    const description = (b.description || '').toLowerCase();
    return name.includes(query) || description.includes(query);
  });
  return filtered;
}

async function boardSummary(flags) {
  if (!flags['board-id']) throw new Error('--board-id is required');
  const boardId = flags['board-id'];
  const [board, pins, sections] = await Promise.all([
    apiRequest(SERVICE, `/boards/${boardId}`),
    apiRequest(SERVICE, `/boards/${boardId}/pins`),
    apiRequest(SERVICE, `/boards/${boardId}/sections`),
  ]);
  return { board, pins, sections };
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': {
    fn: testAuth,
    desc: 'Test authentication (GET /user_account)',
  },
  'get-profile': {
    fn: getProfile,
    desc: 'Get user profile',
  },
  'get-analytics': {
    fn: getAnalytics,
    desc: 'Get account analytics (--start-date, --end-date)',
  },
  'top-pins': {
    fn: topPins,
    desc: 'Get top pins analytics (--start-date, --end-date)',
  },
  'list-followers': {
    fn: listFollowers,
    desc: 'List followers',
  },
  'list-following': {
    fn: listFollowing,
    desc: 'List following users',
  },
  'list-boards': {
    fn: listBoards,
    desc: 'List boards [--limit, --bookmark]',
  },
  'get-board': {
    fn: getBoard,
    desc: 'Get board details (--board-id)',
  },
  'create-board': {
    fn: createBoard,
    desc: 'Create board (--name) [--description, --privacy PUBLIC/SECRET]',
  },
  'update-board': {
    fn: updateBoard,
    desc: 'Update board (--board-id) [--name, --description, --privacy]',
  },
  'delete-board': {
    fn: deleteBoard,
    desc: 'Delete board (--board-id)',
  },
  'list-board-pins': {
    fn: listBoardPins,
    desc: 'List pins in a board (--board-id) [--limit, --bookmark]',
  },
  'list-sections': {
    fn: listSections,
    desc: 'List board sections (--board-id)',
  },
  'create-section': {
    fn: createSection,
    desc: 'Create board section (--board-id, --name)',
  },
  'update-section': {
    fn: updateSection,
    desc: 'Update board section (--board-id, --section-id, --name)',
  },
  'delete-section': {
    fn: deleteSection,
    desc: 'Delete board section (--board-id, --section-id)',
  },
  'list-section-pins': {
    fn: listSectionPins,
    desc: 'List pins in a section (--board-id, --section-id)',
  },
  'list-pins': {
    fn: listPins,
    desc: 'List pins [--limit, --bookmark]',
  },
  'get-pin': {
    fn: getPin,
    desc: 'Get pin details (--pin-id)',
  },
  'create-pin': {
    fn: createPin,
    desc: 'Create pin (--board-id) [--title, --description, --link, --image-url]',
  },
  'update-pin': {
    fn: updatePin,
    desc: 'Update pin (--pin-id) [--title, --description, --link, --board-id]',
  },
  'delete-pin': {
    fn: deletePin,
    desc: 'Delete pin (--pin-id)',
  },
  'pin-analytics': {
    fn: pinAnalytics,
    desc: 'Get pin analytics (--pin-id, --start-date, --end-date)',
  },
  'save-pin': {
    fn: savePin,
    desc: 'Save pin to board (--pin-id, --board-id) [--board-section-id]',
  },
  'search-boards': {
    fn: searchBoards,
    desc: 'Search boards by name/description (--query)',
  },
  'board-summary': {
    fn: boardSummary,
    desc: 'Get board with pins and sections (--board-id)',
  },
};

function printUsage() {
  console.log('Usage: client.js <command> [options]\n');
  console.log('Commands:');
  const maxLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length));
  for (const [name, { desc }] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(maxLen + 2)}${desc}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !COMMANDS[command]) {
    if (command) console.error(`Unknown command: ${command}\n`);
    printUsage();
    process.exit(command ? 1 : 0);
  }

  const flags = parseFlags(args.slice(1));

  try {
    const result = await COMMANDS[command].fn(flags);
    success(result);
  } catch (err) {
    error(err);
  }
}

main();
