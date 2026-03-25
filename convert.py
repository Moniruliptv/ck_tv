import json

INPUT_FILE = "input.json"
OUTPUT_FILE = "output.json"

def convert_json():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    new_data = []

    for item in data:
        new_item = {
            "id": item.get("id", ""),
            "name": item.get("name", ""),
            "logo": item.get("logo", ""),
            "referer": item.get("referer", "")
        }
        new_data.append(new_item)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, indent=4, ensure_ascii=False)

    print("✅ Done")

if __name__ == "__main__":
    convert_json()
