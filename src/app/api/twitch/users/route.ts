/**
 * Twitch User Lookup API Route
 *
 * Proxies the Twitch Helix GET /users endpoint to resolve profile pictures.
 * Uses Client Credentials (App Access Token) so no user login is needed.
 * Gracefully returns empty when credentials are not configured.
 */

// In-memory token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  // Return cached token if it's still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
    return cachedToken.token;
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    console.error("[Twitch Auth] Failed to get token:", response.status);
    return null;
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

interface TwitchUsersResponse {
  data: TwitchUser[];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const userIds: string[] = body.userIds ?? [];
    const logins: string[] = body.logins ?? [];

    if (userIds.length === 0 && logins.length === 0) {
      return Response.json({ status: "success", users: {} });
    }

    const token = await getAppAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!token || !clientId) {
      // Graceful degradation: no credentials configured
      return Response.json({ status: "success", users: {} });
    }

    // Twitch allows up to 100 IDs per request
    const batchIds = userIds.slice(0, 100);
    const batchLogins = logins.slice(0, Math.max(0, 100 - batchIds.length));
    const params = new URLSearchParams();
    batchIds.forEach((id) => params.append("id", id));
    batchLogins.forEach((login) => params.append("login", login));

    const response = await fetch(
      `https://api.twitch.tv/helix/users?${params.toString()}`,
      {
        headers: {
          "Client-Id": clientId,
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      // If token expired, clear cache and retry once
      if (response.status === 401) {
        cachedToken = null;
        const retryToken = await getAppAccessToken();
        if (retryToken) {
          const retryResponse = await fetch(
            `https://api.twitch.tv/helix/users?${params.toString()}`,
            {
              headers: {
                "Client-Id": clientId,
                Authorization: `Bearer ${retryToken}`,
              },
            },
          );
          if (retryResponse.ok) {
            const retryData: TwitchUsersResponse = await retryResponse.json();
            const users: Record<string, { avatarUrl: string; displayName: string }> = {};
            retryData.data.forEach((u) => {
              users[u.id] = {
                avatarUrl: u.profile_image_url,
                displayName: u.display_name,
              };
            });
            return Response.json({ status: "success", users });
          }
        }
      }

      console.error("[Twitch Users] API error:", response.status);
      return Response.json({ status: "success", users: {} });
    }

    const data: TwitchUsersResponse = await response.json();
    const users: Record<string, { avatarUrl: string; displayName: string }> = {};
    data.data.forEach((u) => {
      users[u.id] = {
        avatarUrl: u.profile_image_url,
        displayName: u.display_name,
      };
    });

    return Response.json({ status: "success", users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Twitch Users] Error:", message);
    return Response.json({ status: "success", users: {} });
  }
}
