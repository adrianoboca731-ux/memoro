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

function signRequest(method: string, url: string, params: Record<string, string>, tokenSecret: string) {
  const baseString = buildBaseString(method, url, params);
  const signingKey = `${percentEncode(FLICKR_API_SECRET)}&${percentEncode(tokenSecret)}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const accessToken = searchParams.get("token");
  const accessTokenSecret = searchParams.get("token_secret");
  const userNsid = searchParams.get("nsid");
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "50";

  if (!accessToken || !accessTokenSecret || !userNsid) {
    return NextResponse.json({ error: "Missing Flickr credentials" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  const apiParams: Record<string, string> = {
    method: "flickr.people.getPhotos",
    api_key: FLICKR_API_KEY,
    user_id: userNsid,
    per_page: perPage,
    page: page,
    format: "json",
    nojsoncallback: "1",
    extras: "url_o,url_l,url_m,url_s,title,description,tags,date_upload,original_format",
    oauth_consumer_key: FLICKR_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const baseUrl = "https://api.flickr.com/services/rest/";
  const signature = signRequest("GET", baseUrl, apiParams, accessTokenSecret);
  apiParams.oauth_signature = signature;

  const url = `${baseUrl}?${Object.entries(apiParams)
    .map(([k, v]) => `${k}=${percentEncode(v)}`)
    .join("&")}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.stat !== "ok") {
      console.error("Flickr API error:", data);
      return NextResponse.json({ error: data.message || "Flickr API error" }, { status: 500 });
    }

    const photos = (data.photos?.photo || []).map((p: any) => ({
      id: p.id,
      title: p.title || "Untitled",
      description: p.description?._content || "",
      tags: p.tags || "",
      dateUpload: p.dateupload,
      originalFormat: p.originalformat || "jpg",
      thumbnail: p.url_s || p.url_m,
      medium: p.url_m,
      large: p.url_l,
      original: p.url_o,
    }));

    return NextResponse.json({
      photos,
      total: data.photos?.total || 0,
      page: data.photos?.page || 1,
      pages: data.photos?.pages || 1,
    });
  } catch (error: any) {
    console.error("Flickr photos fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
