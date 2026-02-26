#!/usr/bin/env node

import { apiRequest } from '../../../lib/http.js';
import { success, error } from '../../../lib/output.js';

const SERVICE = 'instagram';

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

// --- Commands ---

async function testAuth() {
  const result = await apiRequest(SERVICE, '/me?fields=id,username');
  return result;
}

async function getProfile() {
  const result = await apiRequest(SERVICE, '/me?fields=id,username,name,biography,followers_count,follows_count,media_count,website,profile_picture_url');
  return result;
}

async function getAccountInsights(flags) {
  if (!flags.since) throw new Error('--since is required (Unix timestamp)');
  if (!flags.until) throw new Error('--until is required (Unix timestamp)');
  const period = flags.period || 'day';
  const result = await apiRequest(SERVICE, `/me/insights?metric=impressions,reach,follower_count,profile_views&period=${period}&since=${flags.since}&until=${flags.until}`);
  return result;
}

async function listMedia(flags) {
  const limit = flags.limit || 25;
  const result = await apiRequest(SERVICE, `/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}`);
  return result;
}

async function getMedia(flags) {
  if (!flags['media-id']) throw new Error('--media-id is required');
  const result = await apiRequest(SERVICE, `/${flags['media-id']}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url}`);
  return result;
}

async function getMediaInsights(flags) {
  if (!flags['media-id']) throw new Error('--media-id is required');
  let metrics = flags.metrics;
  if (!metrics) {
    // Default metrics differ by media type; caller can specify or use defaults for IMAGE/CAROUSEL
    metrics = 'impressions,reach,likes,comments,shares,saved';
  }
  const result = await apiRequest(SERVICE, `/${flags['media-id']}/insights?metric=${metrics}`);
  return result;
}

async function listStories() {
  const result = await apiRequest(SERVICE, '/me/stories?fields=id,media_type,media_url,timestamp');
  return result;
}

async function getStoryInsights(flags) {
  if (!flags['story-id']) throw new Error('--story-id is required');
  const result = await apiRequest(SERVICE, `/${flags['story-id']}/insights?metric=impressions,reach,replies,exits,taps_forward,taps_back`);
  return result;
}

async function listComments(flags) {
  if (!flags['media-id']) throw new Error('--media-id is required');
  const result = await apiRequest(SERVICE, `/${flags['media-id']}/comments?fields=id,text,username,timestamp,like_count,replies{id,text,username,timestamp}`);
  return result;
}

async function getComment(flags) {
  if (!flags['comment-id']) throw new Error('--comment-id is required');
  const result = await apiRequest(SERVICE, `/${flags['comment-id']}?fields=id,text,username,timestamp,like_count`);
  return result;
}

async function replyToComment(flags) {
  if (!flags['comment-id']) throw new Error('--comment-id is required');
  if (!flags.message) throw new Error('--message is required');
  const result = await apiRequest(SERVICE, `/${flags['comment-id']}/replies`, {
    method: 'POST',
    body: { message: flags.message },
  });
  return result;
}

async function deleteComment(flags) {
  if (!flags['comment-id']) throw new Error('--comment-id is required');
  const result = await apiRequest(SERVICE, `/${flags['comment-id']}`, {
    method: 'DELETE',
  });
  return result;
}

async function hideComment(flags) {
  if (!flags['comment-id']) throw new Error('--comment-id is required');
  const hide = flags.unhide ? false : true;
  const result = await apiRequest(SERVICE, `/${flags['comment-id']}`, {
    method: 'POST',
    body: { hide },
  });
  return result;
}

async function sendPrivateReply(flags) {
  if (!flags['comment-id']) throw new Error('--comment-id is required');
  if (!flags.message) throw new Error('--message is required');
  const result = await apiRequest(SERVICE, '/me/messages', {
    method: 'POST',
    body: {
      recipient: { comment_id: flags['comment-id'] },
      message: { text: flags.message },
    },
  });
  return result;
}

async function listTaggedMedia() {
  const result = await apiRequest(SERVICE, '/me/tags?fields=id,caption,media_type,permalink,timestamp');
  return result;
}

async function createContainer(flags) {
  const body = {};
  if (flags['image-url']) body.image_url = flags['image-url'];
  if (flags['video-url']) body.video_url = flags['video-url'];
  if (flags.caption) body.caption = flags.caption;
  if (flags['location-id']) body.location_id = flags['location-id'];
  if (!body.image_url && !body.video_url) {
    throw new Error('--image-url or --video-url is required');
  }
  const result = await apiRequest(SERVICE, '/me/media', {
    method: 'POST',
    body,
  });
  return result;
}

async function createCarouselItem(flags) {
  const body = { is_carousel_item: true };
  if (flags['image-url']) body.image_url = flags['image-url'];
  if (flags['video-url']) body.video_url = flags['video-url'];
  if (!body.image_url && !body.video_url) {
    throw new Error('--image-url or --video-url is required');
  }
  const result = await apiRequest(SERVICE, '/me/media', {
    method: 'POST',
    body,
  });
  return result;
}

async function createStory(flags) {
  const body = { media_type: 'STORIES' };
  if (flags['image-url']) body.image_url = flags['image-url'];
  if (flags['video-url']) body.video_url = flags['video-url'];
  if (!body.image_url && !body.video_url) {
    throw new Error('--image-url or --video-url is required');
  }
  const result = await apiRequest(SERVICE, '/me/media', {
    method: 'POST',
    body,
  });
  return result;
}

async function getContainerStatus(flags) {
  if (!flags['container-id']) throw new Error('--container-id is required');
  const result = await apiRequest(SERVICE, `/${flags['container-id']}?fields=id,status,status_code`);
  return result;
}

async function publishContainer(flags) {
  if (!flags['container-id']) throw new Error('--container-id is required');
  const result = await apiRequest(SERVICE, '/me/media_publish', {
    method: 'POST',
    body: { creation_id: flags['container-id'] },
  });
  return result;
}

// --- CLI Router ---

const COMMANDS = {
  'test-auth': {
    fn: testAuth,
    desc: 'Test authentication (GET /me)',
  },
  'get-profile': {
    fn: getProfile,
    desc: 'Get full profile info',
  },
  'get-account-insights': {
    fn: getAccountInsights,
    desc: 'Get account insights (--since, --until Unix timestamps) [--period]',
  },
  'list-media': {
    fn: listMedia,
    desc: 'List recent media [--limit]',
  },
  'get-media': {
    fn: getMedia,
    desc: 'Get media details (--media-id)',
  },
  'get-media-insights': {
    fn: getMediaInsights,
    desc: 'Get media insights (--media-id) [--metrics comma-sep]',
  },
  'list-stories': {
    fn: listStories,
    desc: 'List current stories',
  },
  'get-story-insights': {
    fn: getStoryInsights,
    desc: 'Get story insights (--story-id)',
  },
  'list-comments': {
    fn: listComments,
    desc: 'List comments on media (--media-id)',
  },
  'get-comment': {
    fn: getComment,
    desc: 'Get comment details (--comment-id)',
  },
  'reply-to-comment': {
    fn: replyToComment,
    desc: 'Reply to a comment (--comment-id, --message)',
  },
  'delete-comment': {
    fn: deleteComment,
    desc: 'Delete a comment (--comment-id)',
  },
  'hide-comment': {
    fn: hideComment,
    desc: 'Hide a comment (--comment-id) [--unhide]',
  },
  'send-private-reply': {
    fn: sendPrivateReply,
    desc: 'Send private reply to comment (--comment-id, --message)',
  },
  'list-tagged-media': {
    fn: listTaggedMedia,
    desc: 'List media where account is tagged',
  },
  'create-container': {
    fn: createContainer,
    desc: 'Create media container (--image-url or --video-url) [--caption, --location-id]',
  },
  'create-carousel-item': {
    fn: createCarouselItem,
    desc: 'Create carousel item (--image-url or --video-url)',
  },
  'create-story': {
    fn: createStory,
    desc: 'Create story container (--image-url or --video-url)',
  },
  'get-container-status': {
    fn: getContainerStatus,
    desc: 'Check container upload status (--container-id)',
  },
  'publish-container': {
    fn: publishContainer,
    desc: 'Publish a container (--container-id)',
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
