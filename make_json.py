import requests
import json
import re

META_URL = "https://raw.githubusercontent.com/sm-monirulislam/SM-Live-TV/refs/heads/main/New_Bdix.m3u"
URL_URL = "https://raw.githubusercontent.com/sm-monirulislam/FanCode-Auto-Update-Playlist/refs/heads/main/Playlist-2026-2-21-173326.m3u"

meta_lines = requests.get(META_URL).text.splitlines()
url_lines = requests.get(URL_URL).text.splitlines()

# url playlist থেকে শুধু stream link বের করা
urls = [l.strip() for l in url_lines if l.startswith("http")]

channels = []

url_index = 0
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

        if url_index < len(urls):

            channels.append({
                "id": tvg_id,
                "title": title,
                "logo": logo,
                "url": urls[url_index],
                "category": category
            })

            url_index += 1

with open("channels.json", "w") as f:
    json.dump(channels, f, indent=2)
