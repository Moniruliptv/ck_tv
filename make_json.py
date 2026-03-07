import requests
import json
import re

META_URL = "https://raw.githubusercontent.com/sm-monirulislam/SM-Live-TV/refs/heads/main/New_Bdix.m3u"
URL_URL = "https://raw.githubusercontent.com/sm-monirulislam/FanCode-Auto-Update-Playlist/refs/heads/main/Playlist-2026-2-21-173326.m3u"

meta_lines = requests.get(META_URL).text.splitlines()
url_lines = requests.get(URL_URL).text.splitlines()

# url → channel name detect
url_map = {}

for line in url_lines:
    if line.startswith("http"):
        m = re.search(r'/([^/]+)/tracks', line)
        if m:
            name = m.group(1).lower()
            url_map[name] = line.strip()

channels = []

tvg_id = ""
title = ""
logo = ""
category = ""

for line in meta_lines:

    if line.startswith("#EXTINF"):

        title = line.split(",")[-1].strip()

        id_match = re.search(r'tvg-id="(.*?)"', line)
        logo_match = re.search(r'tvg-logo="(.*?)"', line)
        group_match = re.search(r'group-title="(.*?)"', line)

        tvg_id = id_match.group(1) if id_match else ""
        logo = logo_match.group(1) if logo_match else ""
        category = group_match.group(1).lower() if group_match else ""

    elif line.startswith("http"):

        key = title.lower().replace(" ", "")

        url = ""
        for k in url_map:
            if key in k:
                url = url_map[k]
                break

        channels.append({
            "id": tvg_id,
            "title": title,
            "logo": logo,
            "url": url,
            "category": category
        })

with open("channels.json","w") as f:
    json.dump(channels,f,indent=2)
