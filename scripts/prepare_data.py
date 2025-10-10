import polars as pl
import json
from pathlib import Path

raw_file = Path("data/raw_data.json")
processed_file = Path("data/processed_data.json")

with open(raw_file, "r") as f:
    data = json.load(f)