import requests
import re

URL = "http://ftpbdlive.com/img/play.php?stream=T-Sports"

headers = {
    "User-Agent": "Mozilla/5.0"
}

def fetch_page():
    r = requests.get(URL, headers=headers)
    return r.text

def extract_stream(html):
    links = []

    # m3u8
    links += re.findall(r'(https?://[^\s"\']+\.m3u8)', html)

    # mpd
    links += re.findall(r'(https?://[^\s"\']+\.mpd)', html)

    # iframe src
    links += re.findall(r'<iframe[^>]+src="([^"]+)"', html)

    # video source
    links += re.findall(r'<source[^>]+src="([^"]+)"', html)

    return list(set(links))


def main():
    html = fetch_page()
    streams = extract_stream(html)

    if not streams:
        print("❌ No stream found")
    else:
        print("✅ Found streams:\n")
        for s in streams:
            print(s)


if __name__ == "__main__":
    main()
