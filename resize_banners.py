from PIL import Image
import os, json

BASE = "/home/z/my-project/download/banners"
OUT = "/home/z/my-project/download/memoro-ads-pack"
os.makedirs(OUT, exist_ok=True)

# Google Ads standard banner sizes
GOOGLE_SIZES = {
    "728x90": (728, 90),    # Leaderboard
    "300x250": (300, 250),  # Medium Rectangle
    "160x600": (160, 600),  # Wide Skyscraper
    "300x600": (300, 600),  # Half Page
    "970x90": (970, 90),    # Large Leaderboard
}

# Load links mapping
with open(f"{BASE}/links.json") as f:
    links = json.load(f)

# Language mapping
LANGS = {
    "it": "Italiano",
    "en": "English", 
    "fr": "Francais",
    "de": "Deutsch",
    "es": "Espanol",
    "pt-BR": "Portugues-BR",
    "ja": "Japanese",
    "ko": "Korean",
    "zh-TW": "Chinese-Traditional",
    "zh-CN": "Chinese-Simplified"
}

manifest = []

for lang_code, lang_name in LANGS.items():
    # Find source banner for this language
    if lang_code == "it":
        source_path = f"{BASE}/memoro-banner-728x90.png"
        vs_path = f"{BASE}/memoro-vs-it.png"
    else:
        source_path = f"{BASE}/{lang_code}/memoro-banner-{lang_code}.png"
        vs_path = f"{BASE}/{lang_code}/memoro-vs-{lang_code}.png"
    
    if not os.path.exists(source_path):
        continue
    
    src_img = Image.open(source_path)
    vs_img = Image.open(vs_path) if os.path.exists(vs_path) else None
    
    for size_name, (w, h) in GOOGLE_SIZES.items():
        # Main banner
        resized = src_img.resize((w, h), Image.LANCZOS)
        fname = f"memoro-{lang_code}-{size_name}.png"
        out_path = f"{OUT}/{fname}"
        resized.save(out_path, "PNG")
        manifest.append({
            "file": fname,
            "lang": lang_name,
            "lang_code": lang_code,
            "size": size_name,
            "dimensions": f"{w}x{h}",
            "type": "main"
        })
        
        # Comparison banner
        if vs_img:
            resized_vs = vs_img.resize((w, h), Image.LANCZOS)
            fname_vs = f"memoro-{lang_code}-vs-{size_name}.png"
            out_path_vs = f"{OUT}/{fname_vs}"
            resized_vs.save(out_path_vs, "PNG")
            manifest.append({
                "file": fname_vs,
                "lang": lang_name,
                "lang_code": lang_code,
                "size": size_name,
                "dimensions": f"{w}x{h}",
                "type": "comparison"
            })

# Save manifest
with open(f"{OUT}/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"✅ Creati {len(manifest)} banner pronti per Google Ads!")
print(f"📁 Cartella: {OUT}")

# Count by language
by_lang = {}
for m in manifest:
    l = m['lang']
    by_lang[l] = by_lang.get(l, 0) + 1
for l, c in by_lang.items():
    print(f"  {l}: {c} banner")
