# Connectors

## How tool references work

Plugin files use `~~category` as a placeholder for whatever tool the user connects in that category. For example, `~~e-commerce` might mean Shopify, WooCommerce, or any other e-commerce platform with a client script.

Plugins are **tool-agnostic** — they describe workflows in terms of categories rather than specific products. The included client scripts implement specific services, but any service in that category works.

## Connectors for this plugin

| Category | Placeholder | Client Script | Other options |
|----------|-------------|---------------|---------------|
| Knowledge base | `~~knowledge-base` | `skills/notion/scripts/client.js` | Confluence |
| E-commerce | `~~e-commerce` | `skills/shopify/scripts/client.js` | WooCommerce, BigCommerce |
| Email marketing | `~~email-marketing` | `skills/klaviyo/scripts/client.js` | Mailchimp, Brevo, Customer.io |
| Customer support | `~~customer-support` | `skills/gorgias/scripts/client.js` | Zendesk, Intercom, Freshdesk |
| Accounting | `~~accounting` | `skills/quickbooks/scripts/client.js` | Xero, FreshBooks |
| Social media | `~~social-media` | `skills/instagram/scripts/client.js`, `skills/pinterest/scripts/client.js` | TikTok |
| Paid social | `~~paid-social` | `skills/meta-ads/scripts/client.js` | TikTok Ads |
| Search ads | `~~search-ads` | `skills/google-ads/scripts/client.js` | Microsoft Ads |
| Analytics | `~~analytics` | `skills/google-analytics/scripts/client.js` | Amplitude, Mixpanel |
| SEO | `~~seo` | `skills/google-search-console/scripts/client.js` | Ahrefs, Semrush |
| Search trends | `~~search-trends` | `skills/google-trends/scripts/client.js` | - |
| DAM | `~~dam` | `skills/air/scripts/client.js` | Bynder, Brandfolder |
| AI generation | `~~ai-generation` | `skills/google-ai-studio/scripts/client.js` | FAL |
| Database | `~~database` | `skills/postgresql/scripts/client.js` | MySQL, Snowflake |
| Data warehouse | `~~data-warehouse` | `skills/google-bigquery/scripts/client.js` | Snowflake |
