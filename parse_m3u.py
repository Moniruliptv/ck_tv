import requests
import json
import re

META_URL = "https://raw.githubusercontent.com/sm-monirulislam/SM-Live-TV/refs/heads/main/New_Bdix.m3u"
URL_SOURCE = "https://raw.githubusercontent.com/sm-monirulislam/FanCode-Auto-Update-Playlist/refs/heads/main/Playlist-2026-2-21-173326.m3u"


def parse_meta(url):
    r = requests.get(url)
    lines = r.text.splitlines()

    data = {}

    tvg_id = ""
    title = ""
    logo = ""
    category = ""

    for line in lines:

        if line.startswith("#EXTINF"):

            title = line.split(",")[-1].strip()

            id_match = re.search(r'tvg-id="(.*?)"', line)
            logo_match = re.search(r'tvg-logo="(.*?)"', line)
            group_match = re.search(r'group-title="(.*?)"', line)

            tvg_id = id_match.group(1) if id_match else ""
            logo = logo_match.group(1) if logo_match else ""
            category = group_match.group(1).lower() if group_match else ""

        elif line.startswith("http"):

            data[tvg_id] = {
                "id": tvg_id,
                "title": title,
                "logo": logo,
                "category": category
            }

    return data


def parse_urls(url):
    r = requests.get(url)
    lines = r.text.splitlines()

    data = {}
    tvg_id = ""

    for line in lines:

        if line.startswith("#EXTINF"):

            id_match = re.search(r'tvg-id="(.*?)"', line)
            tvg_id = id_match.group(1) if id_match else ""

        elif line.startswith("http"):

            data[tvg_id] = line.strip()

    return data


meta_data = parse_meta(META_URL)
url_data = parse_urls(URL_SOURCE)

channels = []

for cid in meta_data:

    if cid in url_data:

        channel = meta_data[cid]
        channel["url"] = url_data[cid]
        channels.append(channel)

with open("channels.json", "w", encoding="utf-8") as f:
    json.dump(channels, f, indent=2)
