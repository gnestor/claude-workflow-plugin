# Connectors

## How tool references work

Plugin files use `~~category` as a placeholder for whatever tool the user connects in that category. For example, `~~e-commerce` might mean Shopify, WooCommerce, or any other e-commerce platform with an MCP server.

Plugins are **tool-agnostic** — they describe workflows in terms of categories rather than specific products. The `.mcp.json` pre-configures specific MCP servers, but any MCP server in that category works.

## Connectors for this plugin

| Category | Placeholder | Included servers | Other options |
|----------|-------------|-----------------|---------------|
| E-commerce | `~~e-commerce` | Shopify | WooCommerce, BigCommerce |
| Email marketing | `~~email-marketing` | Klaviyo | Mailchimp, Brevo, Customer.io |
| Customer support | `~~customer-support` | Gorgias | Zendesk, Intercom, Freshdesk |
| Accounting | `~~accounting` | QuickBooks | Xero, FreshBooks |
| Paid social | `~~paid-social` | Meta Ads | TikTok Ads |
| Search ads | `~~search-ads` | Google Ads | Microsoft Ads |
| Analytics | `~~analytics` | Google Analytics | Amplitude, Mixpanel |
| SEO | `~~seo` | Google Search Console | Ahrefs, Semrush |
| Knowledge base | `~~knowledge-base` | Notion | Confluence |
| Database | `~~database` | PostgreSQL | MySQL, Snowflake |
| Social media | `~~social-media` | Instagram, Pinterest | TikTok |
| DAM | `~~dam` | Air.inc | Bynder, Brandfolder |
| Workspace | `~~workspace` | Gmail, Drive, Sheets, Calendar | Microsoft 365 |
| Search trends | `~~search-trends` | Google Trends | - |
| AI generation | `~~ai-generation` | Google AI Studio | - |
| Browser | `~~browser` | Puppeteer | Playwright |
