#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read --allow-write --allow-run
/**
 * Unified OAuth 2.0 client using RFC 8252 loopback redirect
 *
 * Provides a seamless OAuth flow for non-technical users:
 * 1. Starts a temporary HTTP server on 127.0.0.1
 * 2. Opens the browser to the authorization URL
 * 3. Catches the redirect and extracts the auth code automatically
 * 4. Exchanges the code for tokens
 * 5. Saves tokens to .env
 *
 * Usage:
 *   import { oauthLoopback, saveEnvVar } from 'lib/oauth.ts';
 *
 *   const tokens = await oauthLoopback({
 *     clientId: Deno.env.get("GOOGLE_CLIENT_ID")!,
 *     clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
 *     authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
 *     tokenUrl: "https://oauth2.googleapis.com/token",
 *     scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
 *     serviceName: "Google",
 *   });
 */

import "@std/dotenv/load";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  serviceName: string;
  /** Extra params to include in the auth URL (e.g., access_type: "offline") */
  extraAuthParams?: Record<string, string>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

/**
 * Perform OAuth 2.0 authorization using a loopback redirect server.
 *
 * Opens the user's browser, waits for them to approve, catches the redirect
 * on a local server, and exchanges the code for tokens automatically.
 */
export async function oauthLoopback(config: OAuthConfig): Promise<OAuthTokens> {
  // Start a temporary HTTP server on a random port
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const addr = listener.addr as Deno.NetAddr;
  const redirectUri = `http://127.0.0.1:${addr.port}/callback`;

  console.error(`\n--- ${config.serviceName} OAuth Authentication ---\n`);
  console.error(`Redirect server listening on ${redirectUri}`);

  // Build the authorization URL
  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes.join(" "));

  // Add extra params (e.g., access_type=offline, prompt=consent)
  if (config.extraAuthParams) {
    for (const [key, value] of Object.entries(config.extraAuthParams)) {
      authUrl.searchParams.set(key, value);
    }
  }

  // Open the browser
  console.error("Opening browser for authorization...\n");
  const openCmd = Deno.build.os === "darwin" ? "open" :
                  Deno.build.os === "windows" ? "start" : "xdg-open";
  try {
    const cmd = new Deno.Command(openCmd, { args: [authUrl.toString()] });
    await cmd.output();
  } catch {
    console.error("Could not open browser automatically. Please visit this URL:\n");
    console.error(authUrl.toString());
  }

  console.error("Waiting for authorization...\n");

  // Wait for the callback
  const code = await waitForCallback(listener);
  console.error("Authorization code received. Exchanging for tokens...\n");

  // Exchange code for tokens
  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await tokenResponse.json();

  console.error(`${config.serviceName} authentication successful!\n`);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Wait for the OAuth callback on the loopback server.
 * Returns the authorization code from the redirect URL.
 */
async function waitForCallback(listener: Deno.Listener): Promise<string> {
  const conn = await listener.accept();
  const httpConn = Deno.serveHttp(conn);
  const event = await httpConn.nextRequest();

  if (!event) {
    listener.close();
    throw new Error("No request received on callback server");
  }

  const url = new URL(event.request.url, "http://127.0.0.1");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    await event.respondWith(
      new Response(
        `<html><body><h1>Authorization Failed</h1><p>${error}</p><p>You can close this tab.</p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      )
    );
    listener.close();
    throw new Error(`Authorization denied: ${error}`);
  }

  if (!code) {
    await event.respondWith(
      new Response(
        `<html><body><h1>Error</h1><p>No authorization code received.</p></body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      )
    );
    listener.close();
    throw new Error("No authorization code in callback URL");
  }

  // Send success response to browser
  await event.respondWith(
    new Response(
      `<html><body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h1>Authorization Successful</h1>
          <p>You can close this tab and return to the agent.</p>
        </div>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  );

  // Clean up
  listener.close();

  return code;
}

/**
 * Save or update an environment variable in the .env file.
 */
export async function saveEnvVar(key: string, value: string): Promise<void> {
  const envPath = ".env";
  let envContent = "";

  try {
    envContent = await Deno.readTextFile(envPath);
  } catch {
    // File doesn't exist, will create
  }

  const lines = envContent.split("\n");
  let found = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }

  if (!found) {
    // Add to end, ensuring there's a newline before
    if (lines.length > 0 && lines[lines.length - 1] !== "") {
      lines.push("");
    }
    lines.push(`${key}=${value}`);
  }

  await Deno.writeTextFile(envPath, lines.join("\n"));
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(config: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tokenUrl: string;
}): Promise<string> {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}
