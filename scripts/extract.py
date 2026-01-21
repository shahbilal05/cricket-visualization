import polars as pl
import json
from pathlib import Path

"""
Originally ran combine_json.py to append individual JSON files from data/temp_jsons into raw_data.json

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

"""

PROJECT_ROOT = Path(__file__).parent.parent
INPUT_FILE = PROJECT_ROOT / "data" / "raw_data.json"
OUTPUT_PARQUET = PROJECT_ROOT / "data" / "cricket_ball_by_ball.parquet"

def extract_deliveries_from_match(match_data):
    match_info = match_data.get('info', {})
    match_id = f"{match_info.get('dates', ['unknown'])[0]}-{'-'.join(match_info.get('teams', []))}" # Match ID example: 2024-Australia-England
    match_date = match_info.get('dates', ['unknown'])[0]
    venue = match_info.get('venue', 'unknown')
    city = match_info.get('city', 'unknown')
    season = match_info.get('season', 'unknown')
    
    deliveries = []
    
    for innings in match_data.get('innings', []):
        batting_team = innings.get('team')
        
        for over in innings.get('overs', []):
            over_number = over.get('over')
            
            for delivery in over.get('deliveries', []):
                batter = delivery.get('batter')
                bowler = delivery.get('bowler')
                
                runs_data = delivery.get('runs', {})
                runs_batter = runs_data.get('batter', 0)
                runs_extras = runs_data.get('extras', 0)
                runs_total = runs_data.get('total', 0)
                
                wickets = delivery.get('wickets', [])
                is_wicket = len(wickets) > 0
                wicket_type = wickets[0].get('kind') if wickets else None
                player_out = wickets[0].get('player_out') if wickets else None
                
                extras = delivery.get('extras', {})
                is_noball = 'noballs' in extras
                is_wide = 'wides' in extras
                
                deliveries.append({
                    'match_id': match_id,
                    'match_date': match_date,
                    'venue': venue,
                    'city': city,
                    'season': season,
                    'batting_team': batting_team,
                    'over': over_number,
                    'batter': batter,
                    'bowler': bowler,
                    'runs_batter': runs_batter,
                    'runs_extras': runs_extras,
                    'runs_total': runs_total,
                    'is_wicket': is_wicket,
                    'wicket_type': wicket_type,
                    'player_out': player_out,
                    'is_noball': is_noball,
                    'is_wide': is_wide
                })
    
    return deliveries

with open(INPUT_FILE, 'r') as f:
    all_matches = json.load(f)

all_deliveries = []

for match_data in all_matches:
    try:
        deliveries = extract_deliveries_from_match(match_data)
        all_deliveries.extend(deliveries)
    except Exception as e:
        match_info = match_data.get('info', {})
        match_id = match_info.get('dates', ['unknown'])[0]
        print(f"\n Error processing match {match_id}: {e}")
        continue

print(f"\n {len(all_deliveries):,} deliveries")

df = pl.DataFrame(all_deliveries)

df.write_parquet(OUTPUT_PARQUET)