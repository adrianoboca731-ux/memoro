import { NextResponse } from "next/server";
import crypto from "crypto";

const FLICKR_API_KEY = process.env.FLICKR_API_KEY || "";
const FLICKR_API_SECRET = process.env.FLICKR_API_SECRET || "";
const CALLBACK_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/flickr/callback`
  : "https://my-project-ten-psi-39.vercel.app/api/flickr/callback";

function generateNonce() {
  return crypto.randomBytes(16).toString("hex");
}

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

function buildOAuthHeader(params: Record<string, string>) {
  return (
    "OAuth " +
    Object.keys(params)
      .sort()
      .map((key) => `${percentEncode(key)}="${percentEncode(params[key])}"`)
      .join(",")
  );
}

export async function GET() {
  if (!FLICKR_API_KEY || !FLICKR_API_SECRET) {
    return NextResponse.json(
      { error: "Flickr API credentials not configured" },
      { status: 500 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  // Step 1: Get Request Token
  const requestTokenParams: Record<string, string> = {
    oauth_callback: CALLBACK_URL,
    oauth_consumer_key: FLICKR_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
  };

  const baseUrl = "https://www.flickr.com/services/oauth/request_token";
  const baseString = buildBaseString("GET", baseUrl, requestTokenParams);
  const signingKey = `${percentEncode(FLICKR_API_SECRET)}&`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  requestTokenParams.oauth_signature = signature;

  const url = `${baseUrl}?${Object.entries(requestTokenParams)
    .map(([k, v]) => `${k}=${percentEncode(v)}`)
    .join("&")}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    const params = new URLSearchParams(text);
    const oauthToken = params.get("oauth_token");
    const oauthTokenSecret = params.get("oauth_token_secret");

    if (!oauthToken || !oauthTokenSecret) {
      console.error("Flickr request token failed:", text);
      return NextResponse.json({ error: "Failed to get request token" }, { status: 500 });
    }

    // Step 2: Redirect user to authorize
    const authUrl = `https://www.flickr.com/services/oauth/authorize?oauth_token=${oauthToken}&perms=read`;

    return NextResponse.json({
      authUrl,
      oauthToken,
      oauthTokenSecret,
    });
  } catch (error: any) {
    console.error("Flickr auth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
