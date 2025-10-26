import polars as pl
import json
from pathlib import Path

with open("data/raw_data.json", "r") as f:
    data = json.load(f)

df = pl.from_dicts(data, infer_schema_length=None, strict =False)

# flatten and rename meta column
df = df.with_columns([
    pl.col("meta").struct.field("data_version").alias("data_version"),
    pl.col("meta").struct.field("created").alias("created_date"),
]).drop("meta")

# flatten match info
df = df.with_columns([
    pl.col("info").struct.field("city").alias("city"),
    pl.col("info").struct.field("venue").alias("venue"),
    pl.col("info").struct.field("dates").list.first().alias("match_date"),
    pl.col("info").struct.field("teams").alias("teams"),
    pl.col("info").struct.field("toss").struct.field("winner").alias("toss_winner"),
    pl.col("info").struct.field("outcome").struct.field("winner").alias("match_winner"),
]).drop("info")

# create unique match_id
df = df.with_columns([
    (pl.col("match_date") + "_" + pl.col("teams").list.first()).alias("match_id")
])

# explode creates one row per inning
df = df.explode("innings")
df = df.with_columns([
    pl.col("innings").struct.field("team").alias("batting_team"),
    pl.col("innings").struct.field("overs").alias("overs"),
]).drop("innings")

df = df.explode("overs")
df = df.with_columns([
    pl.col("overs").struct.field("over").alias("over_number"),
    pl.col("overs").struct.field("deliveries").alias("deliveries"),
]).drop("overs")

# one row per ball delivered
df = df.explode("deliveries")
df = df.with_columns([
    pl.col("deliveries").struct.field("batter").alias("batter"),
    pl.col("deliveries").struct.field("bowler").alias("bowler"),
    pl.col("deliveries").struct.field("runs").struct.field("batter").alias("runs_batter"),
    pl.col("deliveries").struct.field("runs").struct.field("total").alias("runs_total"),
    pl.col("deliveries").struct.field("runs").struct.field("extras").alias("runs_extras"),
    pl.col("deliveries").struct.field("wickets").alias("wickets"),
])

# find extras type
df = df.with_columns([
    pl.when(pl.col("deliveries").struct.field("extras").is_not_null())
      .then(
          pl.when(pl.col("deliveries").struct.field("extras").struct.field("wides").is_not_null())
            .then(pl.lit("wides"))
          .when(pl.col("deliveries").struct.field("extras").struct.field("noballs").is_not_null())
            .then(pl.lit("noballs"))
          .when(pl.col("deliveries").struct.field("extras").struct.field("byes").is_not_null())
            .then(pl.lit("byes"))
          .when(pl.col("deliveries").struct.field("extras").struct.field("legbyes").is_not_null())
            .then(pl.lit("legbyes"))
          .otherwise(pl.lit("penalty"))
      )
      .otherwise(None)
      .alias("extras_type"),
]).drop("deliveries")

# legal deliveries (not wides or noballs)
df = df.with_columns([
    pl.when(pl.col("extras_type").is_null())
      .then(pl.lit(True))
      .otherwise(~pl.col("extras_type").is_in(["wides", "noballs"]))
      .alias("is_legal_delivery")
])

# total runs as batter runs + extras  
df = df.with_columns([
    (pl.col("runs_batter") + pl.col("runs_extras")).alias("runs_total"),
    (pl.col("over_number") + 1).alias("over_number")
])

# if wicket, get player_out
df = df.with_columns([
    pl.when(pl.col("wickets").list.len() > 0)
      .then(pl.col("wickets").list.first().struct.field("player_out"))
      .otherwise(None)
      .alias("player_out")
])

# add boundary (4 or 6 runs) and dot balls (0 runs)
df = df.with_columns([
    pl.col("runs_batter").is_in([4, 6]).alias("is_boundary"),
    (pl.col("runs_total") == 0).alias("is_dot_ball"),
])

# ensure correct data types
df = df.with_columns(pl.col("match_date").str.strptime(pl.Date, "%Y-%m-%d"))
df = df.with_columns(pl.col("over_number").cast(pl.Int32))

final_df = df.select([
    "match_id", "match_date", "city", "venue", "batting_team",
    "over_number", "batter", "bowler", "runs_batter", "runs_total",
    "runs_extras", "is_boundary", "is_dot_ball", "is_legal_delivery", "player_out" 
])

final_df = final_df.sort(["match_date", "match_id"])

# write to CSV
output_path = Path("data/processed_data.csv")
final_df.write_csv(output_path)

# Processed 1,314,002 deliveries into CSV 
print(f"Processed {len(final_df):,} deliveries into CSV saved at {output_path}")
