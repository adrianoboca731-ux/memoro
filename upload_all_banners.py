import subprocess, json, time, os

CLOUD_NAME = "dmp9v6pfo"
API_KEY = "748251883573455"
API_SECRET = "1QJ74DBZl7omSxRanJgyaaoH2eU"
FOLDER = "memoro/banners"
BASE = "/home/z/my-project/download/banners"

results = []

banners = []
for root, dirs, files in os.walk(BASE):
    for f in files:
        if f.endswith('.png'):
            banners.append(os.path.join(root, f))
banners.sort()

for filepath in banners:
    fname = os.path.basename(filepath)
    # Get language from subfolder
    rel = os.path.relpath(filepath, BASE)
    parts = rel.split('/')
    lang = parts[0] if len(parts) > 1 else 'it'
    
    timestamp = str(int(time.time()))
    sig_str = f"folder={FOLDER}&overwrite=true&timestamp={timestamp}{API_SECRET}"
    signature = subprocess.check_output(
        ['openssl', 'dgst', '-sha1', '-hex'],
        input=sig_str.encode()
    ).decode().split('= ')[1].strip()
    
    try:
        resp = subprocess.check_output([
            'curl', '-s', '-X', 'POST',
            f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload",
            '-F', f'file=@{filepath}',
            '-F', f'api_key={API_KEY}',
            '-F', f'timestamp={timestamp}',
            '-F', f'folder={FOLDER}',
            '-F', f'signature={signature}',
            '-F', 'overwrite=true'
        ]).decode()
        
        data = json.loads(resp)
        url = data.get('secure_url', 'ERROR')
        public_id = data.get('public_id', 'N/A')
        results.append({'lang': lang, 'file': fname, 'url': url, 'public_id': public_id})
        print(f"✅ [{lang}] {fname} → {url}")
    except Exception as e:
        results.append({'lang': lang, 'file': fname, 'url': 'ERROR', 'error': str(e)})
        print(f"❌ [{lang}] {fname} → ERROR: {e}")

# Save results
with open('/home/z/my-project/download/banners/links.json', 'w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n🎉 Completato! {len([r for r in results if r['url'] != 'ERROR'])}/{len(results)} banner caricati")
print("📄 Links salvati in /home/z/my-project/download/banners/links.json")
