import polars as pl
from pathlib import Path

df = pl.read_csv("data/processed_data.csv")

match_stats = (
    df.group_by("match_id", "match_date", "city", "venue", "batting_team")
    .agg([
        pl.col("runs_batter").sum().alias("runs"),
        pl.col("runs_extras").sum().alias("extras"),
        pl.col("player_out").drop_nulls().count().alias("wickets"),
        pl.col("is_boundary").sum().alias("boundaries"),
        (pl.col("runs_batter") == 6).sum().alias("sixes"),
        pl.col("is_legal_delivery").sum().alias("balls_faced")
    ])
    .with_columns([
        (pl.col("runs") + pl.col("extras")).alias("total_score"),
        (pl.col("balls_faced") / 6).round(1).alias("overs")
    ])
    .sort("match_date")
)

match_stats.write_csv("data/match_stats.csv")
print(f"Computed {len(match_stats):,} team innings")

batter_stats = (
    df.group_by("batter")
    .agg([
        pl.col("match_id").n_unique().alias("matches_played"),
        pl.col("runs_batter").sum().alias("total_runs"),
        pl.col("is_legal_delivery").sum().alias("balls_faced"),
        pl.col("player_out").drop_nulls().count().alias("times_out"),
        pl.col("is_boundary").sum().alias("total_fours"),
        (pl.col("runs_batter") == 6).sum().alias("total_sixes"),
        pl.col("is_dot_ball").sum().alias("dot_balls"),
    ])
    .with_columns([
        # handle division by zero
        pl.when(pl.col("times_out") > 0)
          .then((pl.col("total_runs") / pl.col("times_out")).round(2))
          .otherwise(None)
          .alias("batting_average"),
        
        pl.when(pl.col("balls_faced") > 0)
          .then(((pl.col("total_runs") / pl.col("balls_faced")) * 100).round(2))
          .otherwise(None)
          .alias("strike_rate"),
        
        pl.when(pl.col("balls_faced") > 0)
          .then(((pl.col("dot_balls") / pl.col("balls_faced")) * 100).round(2))
          .otherwise(None)
          .alias("dot_ball_percentage"),
    ])
    .sort("total_runs", descending=True)
)

# highest score per match
highest_scores = (
    df.group_by(["batter", "match_id"])
      .agg(pl.col("runs_batter").sum().alias("match_score"))
      .group_by("batter")
      .agg(pl.col("match_score").max().alias("highest_score"))
)
batter_stats = batter_stats.join(highest_scores, on="batter")

match_scores = df.group_by(["batter", "match_id"]).agg(pl.col("runs_batter").sum().alias("match_score"))

half_centuries = (
    match_scores.filter((pl.col("match_score") >= 50) & (pl.col("match_score") < 100))
    .group_by("batter").count().rename({"count": "half_centuries"})
)

centuries = (
    match_scores.filter(pl.col("match_score") >= 100)
    .group_by("batter").count().rename({"count": "centuries"})
)

batter_stats = (
    batter_stats
    .join(half_centuries, on="batter", how="left")
    .join(centuries, on="batter", how="left")
    .with_columns([
        pl.col("half_centuries").fill_null(0),
        pl.col("centuries").fill_null(0),
    ])
)

# count innings 
innings_count = df.group_by("batter").agg(pl.col("match_id").n_unique().alias("innings"))
batter_stats = batter_stats.join(innings_count, on="batter")

batter_stats.write_csv("data/batter_stats.csv")
print(f"Computed stats for {len(batter_stats):,} batters")

bowler_stats = (
    df.group_by("bowler")
    .agg([
        pl.col("match_id").n_unique().alias("matches_played"),
        pl.col("is_legal_delivery").sum().alias("balls_bowled"),
        pl.col("runs_total").sum().alias("runs_conceded"),
        pl.col("player_out").drop_nulls().count().alias("wickets_taken"),
        pl.col("is_dot_ball").sum().alias("dot_balls"),
        pl.col("runs_extras").sum().alias("extras_conceded"),
    ])
    .with_columns([
        (pl.col("balls_bowled") / 6).round(1).alias("overs_bowled"),
        
        # handle division by zero for bowling stats
        pl.when(pl.col("wickets_taken") > 0)
          .then((pl.col("runs_conceded") / pl.col("wickets_taken")).round(2))
          .otherwise(None)
          .alias("bowling_average"),
        
        pl.when(pl.col("balls_bowled") > 0)
          .then((pl.col("runs_conceded") / (pl.col("balls_bowled") / 6)).round(2))
          .otherwise(None)
          .alias("economy_rate"),
        
        pl.when(pl.col("wickets_taken") > 0)
          .then((pl.col("balls_bowled") / pl.col("wickets_taken")).round(2))
          .otherwise(None)
          .alias("strike_rate"),
    ])
    .sort("wickets_taken", descending=True)
)

# count 4-wicket and 5-wicket (fifer) hauls
wickets_per_match = (
    df.filter(pl.col("player_out").is_not_null())
    .group_by(["bowler", "match_id"])
    .agg(pl.count().alias("wickets_in_match"))
)

four_wickets = (
    wickets_per_match.filter((pl.col("wickets_in_match") >= 4) & (pl.col("wickets_in_match") < 5))
    .group_by("bowler").count().rename({"count": "four_wickets"})
)

five_wickets = (
    wickets_per_match.filter(pl.col("wickets_in_match") >= 5)
    .group_by("bowler").count().rename({"count": "five_wickets"})
)

bowler_stats = (
    bowler_stats
    .join(four_wickets, on="bowler", how="left")
    .join(five_wickets, on="bowler", how="left")
    .with_columns([
        pl.col("four_wickets").fill_null(0),
        pl.col("five_wickets").fill_null(0),
    ])
)

# add innings bowled
innings_bowled = df.group_by("bowler").agg(pl.col("match_id").n_unique().alias("innings_bowled"))
bowler_stats = bowler_stats.join(innings_bowled, on="bowler")

bowler_stats.write_csv("data/bowler_stats.csv")  
print(f"Computed stats for {len(bowler_stats):,} bowlers") 