import requests
import json
import re

API_URL = "https://raw.githubusercontent.com/sm-monirulislam/FanCode-Auto-Update-Playlist/refs/heads/main/Playlist-2026-2-21-173326.m3u"

res = requests.get(API_URL)
lines = res.text.splitlines()

channels = []
name = ""
logo = ""

for line in lines:
    if line.startswith("#EXTINF"):
        name = line.split(",")[-1].strip()
        logo_match = re.search(r'tvg-logo="(.*?)"', line)
        logo = logo_match.group(1) if logo_match else ""
        channel_id = re.sub(r'[^a-z0-9]', '', name.lower())

    elif line.startswith("http"):
        channels.append({
            "id": channel_id,
            "name": name,
            "logo": logo,
            "url": line.strip()
        })

data = {"channels": channels}

with open("channels.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
