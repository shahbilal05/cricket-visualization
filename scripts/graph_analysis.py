import os
import sys
from pathlib import Path
import json

PROJECT_ROOT = Path(__file__).parent.parent
JAR_PATH = PROJECT_ROOT / "scripts" / "graphframes-0.8.2-spark3.2-s_2.12.jar"
PARQUET_PATH = PROJECT_ROOT / "data" / "cricket_ball_by_ball.parquet"
OUTPUT_DIR = PROJECT_ROOT / "data"

os.environ['HADOOP_HOME'] = os.getenv('HADOOP_HOME', "C:/hadoop")
sys.path.append(f"{os.environ['HADOOP_HOME']}/bin")
os.environ['PYSPARK_SUBMIT_ARGS'] = '--master local[*] pyspark-shell'

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, sum as _sum, when, avg, lit

jar_url = f"file:///{str(JAR_PATH).replace(chr(92), '/')}"
spark = SparkSession.builder \
    .appName("CricketGraphX") \
    .master("local[*]") \
    .config("spark.driver.memory", "4g") \
    .config("spark.executor.memory", "4g") \
    .config("spark.sql.shuffle.partitions", "8") \
    .config("spark.driver.extraJavaOptions", "-Djava.security.manager=allow") \
    .config("spark.executor.extraJavaOptions", "-Djava.security.manager=allow") \
    .config("spark.jars", jar_url) \
    .config("spark.driver.extraClassPath", jar_url) \
    .getOrCreate()

spark.sparkContext.addPyFile(str(JAR_PATH))

print("Spark initialized.")

df = spark.read.parquet(str(PARQUET_PATH))

# Filter out wides and no balls
df_clean = df.filter(
    (col("is_wide") == False) &
    (col("is_noball") == False)
)

# Aggregate interactions between each batter-bowler pair
edges = df_clean.groupBy(
    col("batter").alias("src"),
    col("bowler").alias("dst")
).agg(
    _sum("runs_batter").alias("runs_scored"),
    count("*").alias("balls_faced"),
    _sum(when(col("is_wicket") & (col("player_out") == col("batter")), 1).otherwise(0)).alias("dismissals"),
    avg("runs_batter").alias("avg_runs_per_ball"),
    count(when(col("runs_batter") == 0, 1)).alias("dot_balls"),
    count(when(col("runs_batter") == 4, 1)).alias("fours"),
    count(when(col("runs_batter") == 6, 1)).alias("sixes")
).filter(col("balls_faced") >= 12) # Minimum 2 overs faced

# Calculate player's dominance score
edges = edges.withColumn(
    "dominance_score",
    (col("runs_scored") / col("balls_faced")) - (col("dismissals") * 8.0)
).withColumn(
    "strike_rate",
    (col("runs_scored") / col("balls_faced")) * 100
)

# Create vertices which represent a unique player
batters = df_clean.select(col("batter").alias("id")).distinct().withColumn("type", lit("batter"))
bowlers = df_clean.select(col("bowler").alias("id")).distinct().withColumn("type", lit("bowler"))
vertices = batters.union(bowlers).distinct()

# Add career stats to vertices
batter_stats = df_clean.groupBy(col("batter").alias("id")).agg(
    _sum("runs_batter").alias("career_runs"),
    count("*").alias("career_balls"),
    _sum(when(col("is_wicket") & (col("player_out") == col("batter")), 1).otherwise(0)).alias("career_dismissals")
)

bowler_stats = df_clean.groupBy(col("bowler").alias("id")).agg(
    _sum("runs_batter").alias("runs_conceded"),
    count("*").alias("balls_bowled"),
    _sum(when(col("is_wicket"), 1).otherwise(0)).alias("wickets_taken")
)

vertices = vertices.join(batter_stats, "id", "left").join(bowler_stats, "id", "left")

# Simple centrality calculation
batter_degree = edges.groupBy("src").count().withColumnRenamed("count", "out_degree").withColumnRenamed("src", "id")
bowler_degree = edges.groupBy("dst").count().withColumnRenamed("count", "in_degree").withColumnRenamed("dst", "id")

# Combine degrees
player_centrality = vertices.join(batter_degree, "id", "left") \
    .join(bowler_degree, "id", "left") \
    .fillna(0)

# Simple 'PageRank': weighted by total interactions
player_centrality = player_centrality.withColumn(
    "pagerank",
    (col("out_degree") + col("in_degree")) / 1000.0 
)

top_players = player_centrality.select("id", "pagerank").orderBy(col("pagerank").desc()).limit(100)
in_degree = player_centrality.select(col("id"), col("in_degree").alias("inDegree")).orderBy(col("inDegree").desc()).limit(100)
out_degree = player_centrality.select(col("id"), col("out_degree").alias("outDegree")).orderBy(col("outDegree").desc()).limit(100)


# Top dominance matchups
top_dominance = edges.orderBy(col("dominance_score").desc()).limit(200)

# Quality matchups (batters vs good bowlers)
quality_matchups = edges.join(
    bowler_stats.select(col("id").alias("dst"), col("wickets_taken")),
    "dst"
).filter(
    (col("wickets_taken") >= 50) & # Quality bowler 
    (col("dominance_score") > 0.5) # If batter did well
).orderBy(col("dominance_score").desc()).limit(100)

# 1. Players with PageRank/Centrality
vertices_with_pr = player_centrality.select("id", "pagerank", "type", "career_runs", "wickets_taken").fillna(0)

players_json = [
    {
        "id": row.id,
        "pagerank": float(row.pagerank),
        "type": row.type if row.type else "unknown",
        "career_runs": int(row.career_runs) if row.career_runs else 0,
        "wickets": int(row.wickets_taken) if row.wickets_taken else 0
    }
    for row in vertices_with_pr.limit(500).collect()
]

with open(OUTPUT_DIR / "players.json", "w") as f:
    json.dump(players_json, f, indent=2)
print("players.json")

# 2. Top edges for visualization
edges_viz = edges.orderBy(col("balls_faced").desc()).limit(5000)
edges_json = [
    {
        "source": row.src,
        "target": row.dst,
        "runs": int(row.runs_scored),
        "balls": int(row.balls_faced),
        "dismissals": int(row.dismissals),
        "dominance": float(row.dominance_score),
        "strike_rate": float(row.strike_rate),
        "dot_balls": int(row.dot_balls),
        "fours": int(row.fours),
        "sixes": int(row.sixes)
    }
    for row in edges_viz.collect()
]

with open(OUTPUT_DIR / "edges.json", "w") as f:
    json.dump(edges_json, f, indent=2)
print("edges.json")

# 3. Metrics
metrics = {
    "total_players": vertices.count(),
    "total_interactions": edges.count(),
    "total_deliveries_analyzed": df_clean.count(),
    "top_players_by_pagerank": [
        {"player": row.id, "score": float(row.pagerank)}
        for row in top_players.limit(30).collect()
    ],
    "most_active_batters": [
        {"player": row.id, "bowlers_faced": int(row.inDegree)}
        for row in in_degree.limit(30).collect()
    ],
    "most_active_bowlers": [
        {"player": row.id, "batters_bowled_to": int(row.outDegree)}
        for row in out_degree.limit(30).collect()
    ]
}

with open(OUTPUT_DIR / "metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("metrics.json")

# 4. Asymmetric matchups
asymmetric_json = [
    {
        "batter": row.src,
        "bowler": row.dst,
        "runs": int(row.runs_scored),
        "balls": int(row.balls_faced),
        "dismissals": int(row.dismissals),
        "dominance": float(row.dominance_score),
        "strike_rate": float(row.strike_rate),
        "bowler_career_wickets": int(row.wickets_taken) if hasattr(row, 'wickets_taken') else 0
    }
    for row in quality_matchups.limit(100).collect()
]

with open(OUTPUT_DIR / "asymmetric_matchups.json", "w") as f:
    json.dump(asymmetric_json, f, indent=2)
print("asymmetric_matchups.json")

spark.stop()