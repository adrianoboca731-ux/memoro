#!/bin/bash
# Upload all banners to Cloudinary

CLOUD_NAME="dmp9v6pfo"
API_KEY="748251883573455"
API_SECRET="1QJ74DBZl7omSxRanJgyaaoH2eU"

upload_banner() {
  local file="$1"
  local filename=$(basename "$file")
  local folder="memoro/banners"
  
  # Create signature
  local timestamp=$(date +%s)
  local string_to_sign="folder=${folder}&timestamp=${timestamp}${API_SECRET}"
  local signature=$(echo -n "$string_to_sign" | openssl dgst -sha1 -hex | awk '{print $2}')
  
  # Upload
  local response=$(curl -s -X POST "https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload" \
    -F "file=@${file}" \
    -F "api_key=${API_KEY}" \
    -F "timestamp=${timestamp}" \
    -F "folder=${folder}" \
    -F "signature=${signature}" \
    -F "overwrite=true")
  
  local url=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('secure_url','ERROR'))" 2>/dev/null)
  
  if [ "$url" != "ERROR" ] && [ -n "$url" ]; then
    echo "✅ $filename → $url"
  else
    echo "❌ $filename → FAILED"
  fi
}

echo "🚀 Uploading Memoro banners to Cloudinary..."
echo "=============================================="

# Upload all PNG files
find /home/z/my-project/download/banners -name "*.png" | sort | while read file; do
  upload_banner "$file"
done

echo ""
echo "=============================================="
echo "✅ Upload completato!"
