import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ==================== Configuration ====================

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const API_BASE = "https://graph.instagram.com";
const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function getAccessToken() {
  const token = INSTAGRAM_ACCESS_TOKEN || FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Missing INSTAGRAM_ACCESS_TOKEN or FACEBOOK_ACCESS_TOKEN environment variable."
    );
  }
  return token;
}

// ==================== API Request ====================

async function apiRequest(endpoint, options = {}, useGraphAPI = false) {
  const token = getAccessToken();
  const baseUrl = useGraphAPI ? GRAPH_API_BASE : API_BASE;
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${baseUrl}${endpoint}${separator}access_token=${token}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `Instagram API error (${data.error.code}): ${data.error.message}`
    );
  }

  return data;
}

// ==================== Server Setup ====================

const server = new McpServer({
  name: "instagram",
  version: "1.0.0",
});

// ==================== Auth Tool ====================

server.tool("test_auth", "Test Instagram API authentication", {}, async () => {
  try {
    const data = await apiRequest("/me?fields=id,username,name,account_type");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { success: true, message: "Authentication successful.", profile: data },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: false, error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// ==================== Profile Tools ====================

server.tool(
  "get_profile",
  "Get Instagram account profile information including username, biography, follower/following counts, and media count",
  {},
  async () => {
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
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, profile: data }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_account_insights",
  "Get Instagram account-level insights such as reach, impressions, accounts engaged, total interactions, and profile views. Valid periods: day, week, days_28, month, lifetime.",
  {
    period: z
      .enum(["day", "week", "days_28", "month", "lifetime"])
      .default("day")
      .describe("Time period for insights aggregation"),
    metrics: z
      .string()
      .default("reach,impressions")
      .describe(
        "Comma-separated metrics: reach, impressions, accounts_engaged, total_interactions, profile_views"
      ),
  },
  async ({ period, metrics }) => {
    try {
      const data = await apiRequest(
        `/me/insights?metric=${metrics}&period=${period}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, insights: data.data },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== Media Tools ====================

server.tool(
  "list_media",
  "List the account's recent media posts with details including caption, type, URL, engagement counts, and timestamps",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25)
      .describe("Maximum number of media items to return (1-100)"),
  },
  async ({ limit }) => {
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

      const data = await apiRequest(
        `/me/media?fields=${fields}&limit=${limit}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, media: data.data || [], paging: data.paging },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_media",
  "Get detailed information about a specific media post including caption, type, URL, engagement, and carousel children",
  {
    media_id: z.string().describe("The Instagram media ID"),
  },
  async ({ media_id }) => {
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

      const data = await apiRequest(`/${media_id}?fields=${fields}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, media: data }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_media_insights",
  "Get performance insights for a specific media post. Metrics vary by type: images/carousels get impressions, reach, engagement, saved; videos/reels get impressions, reach, plays, saved, shares.",
  {
    media_id: z.string().describe("The Instagram media ID"),
  },
  async ({ media_id }) => {
    try {
      // Try image/carousel metrics first
      const data = await apiRequest(
        `/${media_id}/insights?metric=impressions,reach,engagement,saved`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, insights: data.data },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      // Fallback to video/reel metrics
      try {
        const data = await apiRequest(
          `/${media_id}/insights?metric=impressions,reach,plays,saved,shares`
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, insights: data.data },
                null,
                2
              ),
            },
          ],
        };
      } catch (fallbackError) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: false, error: error.message },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  }
);

server.tool(
  "list_tagged_media",
  "List media posts where the account has been tagged by other users",
  {
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(25)
      .describe("Maximum number of tagged media items to return (1-100)"),
  },
  async ({ limit }) => {
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

      const data = await apiRequest(
        `/me/tags?fields=${fields}&limit=${limit}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, media: data.data || [], paging: data.paging },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== Comment Tools ====================

server.tool(
  "list_comments",
  "List comments on a specific media post, including replies and engagement data",
  {
    media_id: z.string().describe("The Instagram media ID"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(50)
      .describe("Maximum number of comments to return (1-100)"),
  },
  async ({ media_id, limit }) => {
    try {
      const data = await apiRequest(
        `/${media_id}/comments?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username}&limit=${limit}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                comments: data.data || [],
                paging: data.paging,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_comment",
  "Get details of a specific comment including its text, author, timestamp, like count, and replies",
  {
    comment_id: z.string().describe("The Instagram comment ID"),
  },
  async ({ comment_id }) => {
    try {
      const data = await apiRequest(
        `/${comment_id}?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, comment: data }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "reply_to_comment",
  "Post a public reply to a specific comment on a media post",
  {
    comment_id: z.string().describe("The Instagram comment ID to reply to"),
    message: z.string().describe("The reply message text"),
  },
  async ({ comment_id, message }) => {
    try {
      const data = await apiRequest(
        `/${comment_id}/replies?message=${encodeURIComponent(message)}`,
        { method: "POST" }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, reply: data }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "delete_comment",
  "Delete a specific comment from a media post",
  {
    comment_id: z.string().describe("The Instagram comment ID to delete"),
  },
  async ({ comment_id }) => {
    try {
      await apiRequest(`/${comment_id}`, { method: "DELETE" });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Comment ${comment_id} deleted successfully.`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "hide_comment",
  "Hide a specific comment on a media post so it is no longer publicly visible",
  {
    comment_id: z.string().describe("The Instagram comment ID to hide"),
  },
  async ({ comment_id }) => {
    try {
      await apiRequest(`/${comment_id}?hide=true`, { method: "POST" });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `Comment ${comment_id} hidden successfully.`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== Publishing Tools ====================

server.tool(
  "create_container",
  "Create a media container for publishing to Instagram. Supports IMAGE, VIDEO, CAROUSEL_ALBUM, and REELS media types. For carousels, first create individual items with create_carousel_item, then pass their IDs as comma-separated children.",
  {
    media_type: z
      .enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"])
      .describe("The type of media to publish"),
    media_url: z
      .string()
      .optional()
      .describe(
        "Public URL of the media file (image or video). Required for IMAGE, VIDEO, and REELS."
      ),
    caption: z.string().optional().describe("Caption text for the post"),
    children: z
      .string()
      .optional()
      .describe(
        "Comma-separated container IDs for CAROUSEL_ALBUM items (created via create_carousel_item)"
      ),
    share_to_feed: z
      .boolean()
      .default(true)
      .describe("Whether to share REELS to the feed (default: true)"),
    cover_url: z
      .string()
      .optional()
      .describe("Public URL of a custom cover image for REELS"),
    thumb_offset: z
      .number()
      .int()
      .optional()
      .describe("Thumbnail offset in milliseconds for REELS"),
  },
  async ({
    media_type,
    media_url,
    caption,
    children,
    share_to_feed,
    cover_url,
    thumb_offset,
  }) => {
    try {
      const params = new URLSearchParams();

      if (media_type === "CAROUSEL_ALBUM" && children) {
        params.append("media_type", "CAROUSEL");
        params.append("children", children);
      } else if (media_type === "REELS") {
        params.append("media_type", "REELS");
        if (media_url) params.append("video_url", media_url);
        if (share_to_feed !== false) params.append("share_to_feed", "true");
        if (cover_url) params.append("cover_url", cover_url);
        if (thumb_offset !== undefined)
          params.append("thumb_offset", String(thumb_offset));
      } else if (media_type === "VIDEO") {
        params.append("media_type", "VIDEO");
        if (media_url) params.append("video_url", media_url);
      } else {
        // IMAGE
        if (media_url) params.append("image_url", media_url);
      }

      if (caption) params.append("caption", caption);

      const data = await apiRequest(`/me/media?${params.toString()}`, {
        method: "POST",
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, container_id: data.id },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_carousel_item",
  "Create a single carousel item container (IMAGE or VIDEO) to be used as a child in a CAROUSEL_ALBUM publish",
  {
    media_type: z
      .enum(["IMAGE", "VIDEO"])
      .describe("The type of carousel item"),
    media_url: z
      .string()
      .describe("Public URL of the media file (image or video)"),
  },
  async ({ media_type, media_url }) => {
    try {
      const params = new URLSearchParams();
      params.append("is_carousel_item", "true");

      if (media_type === "VIDEO") {
        params.append("media_type", "VIDEO");
        params.append("video_url", media_url);
      } else {
        params.append("image_url", media_url);
      }

      const data = await apiRequest(`/me/media?${params.toString()}`, {
        method: "POST",
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, item_id: data.id },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_container_status",
  "Check the processing status of a media container. Use this to verify a container is ready before publishing, especially for video uploads.",
  {
    container_id: z.string().describe("The container ID to check"),
  },
  async ({ container_id }) => {
    try {
      const data = await apiRequest(
        `/${container_id}?fields=id,status,status_code`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true, status: data }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "publish_container",
  "Publish a prepared media container to the Instagram feed. The container must have a FINISHED status before publishing.",
  {
    container_id: z.string().describe("The container ID to publish"),
  },
  async ({ container_id }) => {
    try {
      const data = await apiRequest(
        `/me/media_publish?creation_id=${container_id}`,
        { method: "POST" }
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, media_id: data.id },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "create_story",
  "Create and immediately publish an Instagram Story from an image or video URL",
  {
    media_url: z
      .string()
      .describe("Public URL of the media file (image or video)"),
    media_type: z
      .enum(["IMAGE", "VIDEO"])
      .default("IMAGE")
      .describe("Type of story media"),
  },
  async ({ media_url, media_type }) => {
    try {
      const params = new URLSearchParams();
      params.append("media_type", "STORIES");

      if (media_type === "VIDEO") {
        params.append("video_url", media_url);
      } else {
        params.append("image_url", media_url);
      }

      // Create container
      const containerData = await apiRequest(
        `/me/media?${params.toString()}`,
        { method: "POST" }
      );
      const containerId = containerData.id;

      // Publish immediately
      const publishData = await apiRequest(
        `/me/media_publish?creation_id=${containerId}`,
        { method: "POST" }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, story_id: publishData.id },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== Private Reply Tool ====================

server.tool(
  "send_private_reply",
  "Send a private direct message reply to the author of a comment. Uses the Facebook Graph API endpoint.",
  {
    comment_id: z
      .string()
      .describe("The Instagram comment ID to privately reply to"),
    message: z.string().describe("The private reply message text"),
  },
  async ({ comment_id, message }) => {
    try {
      await apiRequest(
        `/${comment_id}/private_replies?message=${encodeURIComponent(message)}`,
        { method: "POST" },
        true // Use Facebook Graph API
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, message: "Private reply sent successfully." },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== Story Tools ====================

server.tool(
  "list_stories",
  "List the account's currently active Instagram Stories",
  {},
  async () => {
    try {
      const data = await apiRequest(
        "/me/stories?fields=id,media_type,media_url,timestamp,permalink"
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, stories: data.data || [] },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "get_story_insights",
  "Get performance insights for a specific Instagram Story including impressions, reach, replies, taps forward/back, and exits",
  {
    story_id: z.string().describe("The Instagram story ID"),
  },
  async ({ story_id }) => {
    try {
      const data = await apiRequest(
        `/${story_id}/insights?metric=impressions,reach,replies,taps_forward,taps_back,exits`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { success: true, insights: data.data },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: false, error: error.message }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }
);

// ==================== Start Server ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
