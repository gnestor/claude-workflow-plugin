# Air Boards Reference

This reference helps agents navigate the Air workspace to find the right content.

## Top-Level Boards

| Board | ID | Keywords | Description |
|-------|------|----------|-------------|
| AI | `bb32c826-3790-485f-92d2-6331c6b2e115` | ai, generated, artificial, synthetic | AI-generated content |
| Instagram | `993a738c-9f0c-4586-90f9-7784423a84c9` | instagram, ugc, user generated, social, repost, tagged, mentions | UGC posts that tag or mention Your Brand, content from @yourbrand |
| TikTok | `3657e381-5413-4273-a724-feae181d9d1b` | tiktok, ugc, user generated, viral, trending | UGC posts that tag or mention Your Brand on TikTok |
| Product Media | `35bae98c-68da-4368-8035-910dc967369f` | product, media, photos, images, video, catalog, flats, stills | Official product images and video |
| Products | `56dcc14f-eb9b-456b-93ab-cecf1a20e4e0` | products, shorts, bells, bikini, cabana, trunks, organized | Content organized by product type |
| Emails | `f660cb89-6fd1-4e0e-afab-d043e06e8beb` | email, campaign, newsletter, marketing, klaviyo | Content organized for email campaign design |
| Ads | `c9018e4d-411b-4498-a8d4-70c546a3b030` | ads, advertising, meta, facebook, paid, campaigns | Content organized for advertising |
| Hero | `839d3114-e141-4b25-a7e4-a6e72bda09d3` | hero, favorites, best, press, pr, evergreen, brand | Team favorites - awesome, evergreen brand photos |

### Year Archives

Historical content organized by year. Use these when looking for content from a specific time period.

| Board | ID | Keywords |
|-------|------|----------|
| 2026 | `803c66d5-82a5-40b0-b7fc-793c48b84a02` | 2026, current, new |
| 2025 | `bb7ed8d7-1aae-455b-904b-3d1f5566446e` | 2025, recent |
| 2024 | `6beef5ca-f29c-4a40-8cd7-492c6b617f2c` | 2024 |
| 2023 | `45a4672b-9a10-420a-af9c-4736252e6394` | 2023 |
| 2022 | `30928894-a784-4d4a-bce7-b9bc7feb2adf` | 2022 |
| 2021 | `1c1ff4eb-d7fb-494c-bae9-d562a0375c37` | 2021 |
| 2020 | `03c596fd-22e3-42ca-ab67-0e3de4e4e926` | 2020 |
| 2019 | `ae37b881-054b-465e-8675-54d1c0a44b73` | 2019, archive, old |

---

## Board Structure

> **Note**: This tree was last updated January 2026. Run the board listing command to get the current structure.

### Ads
- Black Friday 25 (12 sub-boards)
- Published (69 sub-boards) - past ad campaigns
- Ready for Treatment (8 sub-boards)
- Ready to Publish (2 sub-boards)

### AI
- Carla's AI Experiments
- One-piece Swimsuit
- Vintage Ad Reproductions

### Emails
- Backgrounds
- Fall/Holiday 2025 (22 sub-boards)
- Spring/Summer 25 (42 sub-boards)
- Summer 24 Emails (11 sub-boards)
- Winter 24 Emails (32 sub-boards)

### Hero
- Press / Press Photos
- TV and Film (4 sub-boards)
- UGC Hero

### Instagram
- 2,947 sub-boards organized by Instagram username
- Each user has their own board with their UGC

### Product Media
- Flats - flat lay product photos
- Stills - product stills
- Video - product videos

### Products
Organized by product type:
- Bikini (4 sub-boards)
- Cabana Set (5 sub-boards)
- Men's Bell (3 sub-boards)
- Men's Short (4 sub-boards)
- Women's Bell (2 sub-boards)
- Women's Short (4 sub-boards)
- Kid's Shorts, Kid's Overalls
- Trunks: Boardrider, Dolphin
- And more...

### TikTok
- 214 sub-boards organized by TikTok username
- Each user has their own board with their UGC

### Year Archives (2019-2026)
Each year contains:
- Content Creators - influencer content
- Photographers - professional shoots
- Lifestyle - lifestyle photography
- Studio/Catalog - studio shots

---

## Finding Content

| Looking for... | Start with |
|----------------|------------|
| UGC / user-generated content | Instagram, TikTok |
| Product shots / catalog images | Product Media, Products |
| Email campaign assets | Emails |
| Ad creative / paid media | Ads |
| Best brand photos / PR | Hero |
| Content by product type | Products |
| Historical content | Year archives (2019-2026) |
| AI-generated content | AI |

### Search Tips

1. **Use AI-friendly search terms** - Asset descriptions are AI-generated and won't know specific product names. Search for generic descriptions:
   - "navy shorts" instead of "Navy Dolphin Trunks"
   - "burgundy pants" instead of "Burgundy Bells"
   - "striped swimsuit" instead of specific SKU

2. **Check smartTags** - Results include AI-generated tags that can help refine searches

3. **Navigate by board** - For specific content types, filter by board ID rather than global search

4. **Combine approaches** - Search within a specific board for best results:
   ```bash
   list-assets --board-id <board-id> --search "search term"
   ```
