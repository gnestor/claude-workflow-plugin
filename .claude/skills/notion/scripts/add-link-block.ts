#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

import "@std/dotenv/load";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: Deno.env.get("NOTION_API_TOKEN") });

const pageId = Deno.args[0];
const linkText = Deno.args[1];
const url = Deno.args[2];

const response = await notion.blocks.children.append({
  block_id: pageId,
  children: [
    {
      type: "paragraph",
      paragraph: {
        rich_text: [{
          type: "text",
          text: {
            content: linkText,
            link: { url: url }
          }
        }]
      }
    }
  ]
});

console.log(JSON.stringify({ success: true }, null, 2));
