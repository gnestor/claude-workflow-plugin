#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Instagram Graph API Client for Claude Code Skill
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write instagram-client.ts <command> [args...]
 *
 * Commands:
 *   test-auth                                    - Test API authentication
 *
 *   # Account & Profile
 *   get-profile                                  - Get account profile info
 *   get-account-insights --period day --metrics reach,impressions
 *
 *   # Media
 *   list-media [--limit N]                       - List account's media
 *   get-media <media-id>                         - Get media details
 *   get-media-insights <media-id>                - Get media insights
 *   download-media <media-id> <output-path>      - Download media file
 *   list-tagged-media [--limit N]                - List media where account is tagged
 *
 *   # Comments
 *   list-comments <media-id> [--limit N]         - List comments on media
 *   get-comment <comment-id>                     - Get comment details
 *   reply-to-comment <comment-id> <message>      - Reply to a comment
 *   delete-comment <comment-id>                  - Delete a comment
 *   hide-comment <comment-id>                    - Hide a comment
 *
 *   # Publishing
 *   create-container --media-type TYPE --media-url URL [--caption TEXT]
 *   create-carousel-item --media-type TYPE --media-url URL
 *   get-container-status <container-id>          - Check container status
 *   publish-container <container-id>             - Publish container to feed
 *   create-story --media-url URL                 - Create and publish story
 *
 *   # Private Replies
 *   send-private-reply <comment-id> <message>    - Send DM reply to commenter
 *
 *   # Stories
 *   list-stories                                 - List active stories
 *   get-story-insights <story-id>                - Get story insights
 */

import "@std/dotenv/load";

// Instagram Graph API configuration
const INSTAGRAM_ACCESS_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN");
const FACEBOOK_ACCESS_TOKEN = Deno.env.get("FACEBOOK_ACCESS_TOKEN");
const API_BASE = "https://graph.instagram.com";
const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

// Get the best available token
function getAccessToken(): string {
  const token = INSTAGRAM_ACCESS_TOKEN || FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Missing INSTAGRAM_ACCESS_TOKEN or FACEBOOK_ACCESS_TOKEN in .env file. See SKILL.md for setup instructions."
    );
  }
  return token;
}

// ==================== Utility Functions ====================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function parseArgs(args: string[]): { flags: Record<string, string>; positional: string[] } {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      flags[key] = value;
    } else {
      positional.push(args[i]);
    }
  }

  return { flags, positional };
}

// ==================== API Request Functions ====================

interface GraphAPIResponse {
  data?: unknown[];
  paging?: {
    cursors?: { before?: string; after?: string };
    next?: string;
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
  [key: string]: unknown;
}

async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  useGraphAPI = false
): Promise<GraphAPIResponse> {
  const token = getAccessToken();
  const baseUrl = useGraphAPI ? GRAPH_API_BASE : API_BASE;

  // Add access token to URL
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${baseUrl}${endpoint}${separator}access_token=${token}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram API error (${data.error.code}): ${data.error.message}`);
  }

  return data;
}

// ==================== Auth Operations ====================

async function testAuth(): Promise<{ success: boolean; message?: string; error?: string; profile?: unknown }> {
  try {
    const data = await apiRequest("/me?fields=id,username,name,account_type");
    return {
      success: true,
      message: "Authentication successful.",
      profile: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Profile Operations ====================

async function getProfile(): Promise<{ success: boolean; profile?: unknown; error?: string }> {
  try {
    const fields = [
      "id",
      "username",
      "name",
      "biography",
      "website",
      "followers_count",
      "follows_count",
      "media_count",
      "profile_picture_url",
    ].join(",");

    const data = await apiRequest(`/me?fields=${fields}`);
    return {
      success: true,
      profile: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function getAccountInsights(
  period: string = "day",
  metrics: string = "reach,impressions"
): Promise<{ success: boolean; insights?: unknown; error?: string }> {
  try {
    // Valid periods: day, week, days_28, month, lifetime
    // Valid metrics: reach, impressions, accounts_engaged, total_interactions, profile_views
    const data = await apiRequest(
      `/me/insights?metric=${metrics}&period=${period}`
    );
    return {
      success: true,
      insights: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Media Operations ====================

async function listMedia(
  limit: number = 25
): Promise<{ success: boolean; media?: unknown[]; paging?: unknown; error?: string }> {
  try {
    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
      "thumbnail_url",
    ].join(",");

    const data = await apiRequest(`/me/media?fields=${fields}&limit=${limit}`);
    return {
      success: true,
      media: data.data || [],
      paging: data.paging,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function getMedia(
  mediaId: string
): Promise<{ success: boolean; media?: unknown; error?: string }> {
  try {
    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
      "thumbnail_url",
      "username",
      "children{id,media_type,media_url}",
    ].join(",");

    const data = await apiRequest(`/${mediaId}?fields=${fields}`);
    return {
      success: true,
      media: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function getMediaInsights(
  mediaId: string
): Promise<{ success: boolean; insights?: unknown; error?: string }> {
  try {
    // Metrics vary by media type
    // Images/Carousels: impressions, reach, engagement, saved
    // Videos: impressions, reach, video_views
    // Reels: comments, likes, reach, saved, shares, plays
    const data = await apiRequest(
      `/${mediaId}/insights?metric=impressions,reach,engagement,saved`
    );
    return {
      success: true,
      insights: data.data,
    };
  } catch (error) {
    // Try with video metrics if image metrics fail
    try {
      const data = await apiRequest(
        `/${mediaId}/insights?metric=impressions,reach,plays,saved,shares`
      );
      return {
        success: true,
        insights: data.data,
      };
    } catch {
      return { success: false, error: getErrorMessage(error) };
    }
  }
}

async function downloadMedia(
  mediaId: string,
  outputPath: string
): Promise<{ success: boolean; path?: string; size?: number; error?: string }> {
  try {
    // Get media URL
    const mediaResult = await getMedia(mediaId);
    if (!mediaResult.success || !mediaResult.media) {
      throw new Error(mediaResult.error || "Failed to get media details");
    }

    const media = mediaResult.media as { media_url?: string; thumbnail_url?: string };
    const mediaUrl = media.media_url || media.thumbnail_url;

    if (!mediaUrl) {
      throw new Error("No media URL available");
    }

    // Download the file
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const content = await response.arrayBuffer();
    await Deno.writeFile(outputPath, new Uint8Array(content));

    return {
      success: true,
      path: outputPath,
      size: content.byteLength,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function listTaggedMedia(
  limit: number = 25
): Promise<{ success: boolean; media?: unknown[]; paging?: unknown; error?: string }> {
  try {
    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "permalink",
      "timestamp",
      "like_count",
      "comments_count",
      "username",
    ].join(",");

    const data = await apiRequest(`/me/tags?fields=${fields}&limit=${limit}`);
    return {
      success: true,
      media: data.data || [],
      paging: data.paging,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Comment Operations ====================

async function listComments(
  mediaId: string,
  limit: number = 50
): Promise<{ success: boolean; comments?: unknown[]; paging?: unknown; error?: string }> {
  try {
    const data = await apiRequest(
      `/${mediaId}/comments?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username}&limit=${limit}`
    );
    return {
      success: true,
      comments: data.data || [],
      paging: data.paging,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function getComment(
  commentId: string
): Promise<{ success: boolean; comment?: unknown; error?: string }> {
  try {
    const data = await apiRequest(
      `/${commentId}?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username}`
    );
    return {
      success: true,
      comment: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function replyToComment(
  commentId: string,
  message: string
): Promise<{ success: boolean; reply?: unknown; error?: string }> {
  try {
    const data = await apiRequest(
      `/${commentId}/replies?message=${encodeURIComponent(message)}`,
      { method: "POST" }
    );
    return {
      success: true,
      reply: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function deleteComment(
  commentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/${commentId}`, { method: "DELETE" });
    return {
      success: true,
      message: `Comment ${commentId} deleted successfully.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function hideComment(
  commentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    await apiRequest(`/${commentId}?hide=true`, { method: "POST" });
    return {
      success: true,
      message: `Comment ${commentId} hidden successfully.`,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Publishing Operations ====================

interface ContainerOptions {
  mediaType: string;
  mediaUrl?: string;
  caption?: string;
  children?: string;
  shareToFeed?: boolean;
  coverUrl?: string;
  thumbOffset?: number;
}

async function createContainer(
  options: ContainerOptions
): Promise<{ success: boolean; containerId?: string; error?: string }> {
  try {
    const params = new URLSearchParams();

    if (options.mediaType === "CAROUSEL_ALBUM" && options.children) {
      // Carousel container
      params.append("media_type", "CAROUSEL");
      params.append("children", options.children);
    } else if (options.mediaType === "REELS") {
      // Reels container
      params.append("media_type", "REELS");
      if (options.mediaUrl) params.append("video_url", options.mediaUrl);
      if (options.shareToFeed !== false) params.append("share_to_feed", "true");
      if (options.coverUrl) params.append("cover_url", options.coverUrl);
      if (options.thumbOffset) params.append("thumb_offset", String(options.thumbOffset));
    } else if (options.mediaType === "VIDEO") {
      // Video container
      params.append("media_type", "VIDEO");
      if (options.mediaUrl) params.append("video_url", options.mediaUrl);
    } else {
      // Image container
      if (options.mediaUrl) params.append("image_url", options.mediaUrl);
    }

    if (options.caption) params.append("caption", options.caption);

    const data = await apiRequest(`/me/media?${params.toString()}`, { method: "POST" });
    return {
      success: true,
      containerId: data.id as string,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function createCarouselItem(
  mediaType: string,
  mediaUrl: string
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append("is_carousel_item", "true");

    if (mediaType === "VIDEO") {
      params.append("media_type", "VIDEO");
      params.append("video_url", mediaUrl);
    } else {
      params.append("image_url", mediaUrl);
    }

    const data = await apiRequest(`/me/media?${params.toString()}`, { method: "POST" });
    return {
      success: true,
      itemId: data.id as string,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function getContainerStatus(
  containerId: string
): Promise<{ success: boolean; status?: unknown; error?: string }> {
  try {
    const data = await apiRequest(`/${containerId}?fields=id,status,status_code`);
    return {
      success: true,
      status: data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function publishContainer(
  containerId: string
): Promise<{ success: boolean; mediaId?: string; error?: string }> {
  try {
    const data = await apiRequest(
      `/me/media_publish?creation_id=${containerId}`,
      { method: "POST" }
    );
    return {
      success: true,
      mediaId: data.id as string,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function createStory(
  mediaUrl: string,
  mediaType: string = "IMAGE"
): Promise<{ success: boolean; storyId?: string; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.append("media_type", "STORIES");

    if (mediaType === "VIDEO") {
      params.append("video_url", mediaUrl);
    } else {
      params.append("image_url", mediaUrl);
    }

    // Create container
    const containerData = await apiRequest(`/me/media?${params.toString()}`, { method: "POST" });
    const containerId = containerData.id as string;

    // Publish immediately (stories don't need status check for images)
    const publishData = await apiRequest(
      `/me/media_publish?creation_id=${containerId}`,
      { method: "POST" }
    );

    return {
      success: true,
      storyId: publishData.id as string,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Private Reply Operations ====================

async function sendPrivateReply(
  commentId: string,
  message: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Private replies go through the Facebook Graph API
    await apiRequest(
      `/${commentId}/private_replies?message=${encodeURIComponent(message)}`,
      { method: "POST" },
      true // Use Facebook Graph API
    );
    return {
      success: true,
      message: "Private reply sent successfully.",
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Story Operations ====================

async function listStories(): Promise<{ success: boolean; stories?: unknown[]; error?: string }> {
  try {
    const data = await apiRequest("/me/stories?fields=id,media_type,media_url,timestamp,permalink");
    return {
      success: true,
      stories: data.data || [],
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

async function getStoryInsights(
  storyId: string
): Promise<{ success: boolean; insights?: unknown; error?: string }> {
  try {
    // Story metrics: impressions, reach, replies, taps_forward, taps_back, exits
    const data = await apiRequest(
      `/${storyId}/insights?metric=impressions,reach,replies,taps_forward,taps_back,exits`
    );
    return {
      success: true,
      insights: data.data,
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// ==================== Main Command Router ====================

async function main() {
  const args = Deno.args;
  const command = args[0];
  const { flags, positional } = parseArgs(args.slice(1));

  try {
    let result: unknown;

    switch (command) {
      // Auth
      case "test-auth":
        result = await testAuth();
        break;

      // Profile
      case "get-profile":
        result = await getProfile();
        break;

      case "get-account-insights":
        result = await getAccountInsights(
          flags.period || "day",
          flags.metrics || "reach,impressions"
        );
        break;

      // Media
      case "list-media":
        result = await listMedia(
          flags.limit ? parseInt(flags.limit) : 25
        );
        break;

      case "get-media":
        if (!positional[0]) {
          console.error("Missing media ID");
          Deno.exit(1);
        }
        result = await getMedia(positional[0]);
        break;

      case "get-media-insights":
        if (!positional[0]) {
          console.error("Missing media ID");
          Deno.exit(1);
        }
        result = await getMediaInsights(positional[0]);
        break;

      case "download-media":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: download-media <media-id> <output-path>");
          Deno.exit(1);
        }
        result = await downloadMedia(positional[0], positional[1]);
        break;

      case "list-tagged-media":
        result = await listTaggedMedia(
          flags.limit ? parseInt(flags.limit) : 25
        );
        break;

      // Comments
      case "list-comments":
        if (!positional[0]) {
          console.error("Missing media ID");
          Deno.exit(1);
        }
        result = await listComments(
          positional[0],
          flags.limit ? parseInt(flags.limit) : 50
        );
        break;

      case "get-comment":
        if (!positional[0]) {
          console.error("Missing comment ID");
          Deno.exit(1);
        }
        result = await getComment(positional[0]);
        break;

      case "reply-to-comment":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: reply-to-comment <comment-id> <message>");
          Deno.exit(1);
        }
        result = await replyToComment(positional[0], positional[1]);
        break;

      case "delete-comment":
        if (!positional[0]) {
          console.error("Missing comment ID");
          Deno.exit(1);
        }
        result = await deleteComment(positional[0]);
        break;

      case "hide-comment":
        if (!positional[0]) {
          console.error("Missing comment ID");
          Deno.exit(1);
        }
        result = await hideComment(positional[0]);
        break;

      // Publishing
      case "create-container":
        if (!flags["media-type"]) {
          console.error("Missing --media-type (IMAGE, VIDEO, CAROUSEL_ALBUM, REELS)");
          Deno.exit(1);
        }
        result = await createContainer({
          mediaType: flags["media-type"],
          mediaUrl: flags["media-url"],
          caption: flags.caption,
          children: flags.children,
          shareToFeed: flags["share-to-feed"] !== "false",
          coverUrl: flags["cover-url"],
          thumbOffset: flags["thumb-offset"] ? parseInt(flags["thumb-offset"]) : undefined,
        });
        break;

      case "create-carousel-item":
        if (!flags["media-type"] || !flags["media-url"]) {
          console.error("Usage: create-carousel-item --media-type IMAGE|VIDEO --media-url URL");
          Deno.exit(1);
        }
        result = await createCarouselItem(flags["media-type"], flags["media-url"]);
        break;

      case "get-container-status":
        if (!positional[0]) {
          console.error("Missing container ID");
          Deno.exit(1);
        }
        result = await getContainerStatus(positional[0]);
        break;

      case "publish-container":
        if (!positional[0]) {
          console.error("Missing container ID");
          Deno.exit(1);
        }
        result = await publishContainer(positional[0]);
        break;

      case "create-story":
        if (!flags["media-url"]) {
          console.error("Usage: create-story --media-url URL [--media-type IMAGE|VIDEO]");
          Deno.exit(1);
        }
        result = await createStory(flags["media-url"], flags["media-type"] || "IMAGE");
        break;

      // Private Replies
      case "send-private-reply":
        if (!positional[0] || !positional[1]) {
          console.error("Usage: send-private-reply <comment-id> <message>");
          Deno.exit(1);
        }
        result = await sendPrivateReply(positional[0], positional[1]);
        break;

      // Stories
      case "list-stories":
        result = await listStories();
        break;

      case "get-story-insights":
        if (!positional[0]) {
          console.error("Missing story ID");
          Deno.exit(1);
        }
        result = await getStoryInsights(positional[0]);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error("Run without arguments to see available commands.");
        Deno.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify({ success: false, error: getErrorMessage(error) }, null, 2)
    );
    Deno.exit(1);
  }
}

main();
