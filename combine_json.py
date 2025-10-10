# combine individual JSON files from data/temp_jsons into raw_data.json

import json
from pathlib import Path

temp_folder = Path("data/temp_jsons")
output_file = Path("data/raw_data.json")

combined = []

for file in temp_folder.glob("*.json"):
    with open(file, "r", encoding="utf-8") as f:
        combined.append(json.load(f))

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(combined, f, indent=2)

print(f"Combined {len(combined)} files into {output_file}")
