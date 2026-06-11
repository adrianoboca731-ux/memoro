import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const FLICKR_API_KEY = process.env.FLICKR_API_KEY || "";
const FLICKR_API_SECRET = process.env.FLICKR_API_SECRET || "";

function percentEncode(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildBaseString(method: string, url: string, params: Record<string, string>) {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
  return `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sorted)}`;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");
  const tokenSecret = searchParams.get("ts"); // We'll pass token secret via state

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(new URL("/carica?flickr=error", req.url));
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  // Step 3: Exchange request token for access token
  const accessTokenParams: Record<string, string> = {
    oauth_consumer_key: FLICKR_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: oauthToken,
    oauth_verifier: oauthVerifier,
    oauth_version: "1.0",
  };

  const baseUrl = "https://www.flickr.com/services/oauth/access_token";
  const baseString = buildBaseString("GET", baseUrl, accessTokenParams);
  const signingKey = `${percentEncode(FLICKR_API_SECRET)}&${percentEncode(tokenSecret || "")}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  accessTokenParams.oauth_signature = signature;

  const url = `${baseUrl}?${Object.entries(accessTokenParams)
    .map(([k, v]) => `${k}=${percentEncode(v)}`)
    .join("&")}`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const params = new URLSearchParams(text);

    const accessToken = params.get("oauth_token");
    const accessTokenSecret = params.get("oauth_token_secret");
    const userNsid = params.get("user_nsid");
    const username = params.get("username");
    const fullname = params.get("fullname");

    if (!accessToken || !accessTokenSecret) {
      console.error("Flickr access token failed:", text);
      return NextResponse.redirect(new URL("/carica?flickr=error", req.url));
    }

    // Redirect back to carica page with token info in URL
    // In production, you'd store these securely in the session/DB
    const redirectUrl = new URL("/carica", req.url);
    redirectUrl.searchParams.set("flickr", "connected");
    redirectUrl.searchParams.set("flickr_token", accessToken);
    redirectUrl.searchParams.set("flickr_token_secret", accessTokenSecret);
    redirectUrl.searchParams.set("flickr_nsid", userNsid || "");
    redirectUrl.searchParams.set("flickr_username", username || "");
    redirectUrl.searchParams.set("flickr_fullname", fullname || "");

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Flickr callback error:", error);
    return NextResponse.redirect(new URL("/carica?flickr=error", req.url));
  }
}
