
-- base table
CREATE TABLE match_stats (
    match_id TEXT NOT NULL,
    match_date DATE NOT NULL,
    city TEXT,
    venue TEXT,
    batting_team TEXT NOT NULL,
    runs INTEGER NOT NULL,
    extras INTEGER NOT NULL,
    wickets INTEGER NOT NULL,
    boundaries INTEGER NOT NULL,
    sixes INTEGER NOT NULL,
    balls_faced INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    overs NUMERIC(4,1) NOT NULL,
    PRIMARY KEY (match_id, batting_team)
);

-- indexes to speed queries
CREATE INDEX idx_match_stats_date ON match_stats(match_date);
CREATE INDEX idx_match_stats_team ON match_stats(batting_team);
CREATE INDEX idx_match_stats_venue ON match_stats(venue);

-- derived tables

CREATE TABLE batter_stats (
    batter TEXT PRIMARY KEY,
    matches_played INTEGER NOT NULL,
    total_runs INTEGER NOT NULL,
    balls_faced INTEGER NOT NULL,
    times_out INTEGER NOT NULL,
    total_fours INTEGER NOT NULL,
    total_sixes INTEGER NOT NULL,
    dot_balls INTEGER NOT NULL,
    batting_average NUMERIC(6,2),
    strike_rate NUMERIC(6,2),
    dot_ball_percentage NUMERIC(5,2),
    highest_score INTEGER NOT NULL,
    half_centuries INTEGER DEFAULT 0,
    centuries INTEGER DEFAULT 0,
    innings INTEGER NOT NULL
);

CREATE INDEX idx_batter_runs ON batter_stats(total_runs DESC);
CREATE INDEX idx_batter_average ON batter_stats(batting_average DESC);
CREATE INDEX idx_batter_strike_rate ON batter_stats(strike_rate DESC);

CREATE TABLE bowler_stats (
    bowler TEXT PRIMARY KEY,
    matches_played INTEGER NOT NULL,
    balls_bowled INTEGER NOT NULL,
    runs_conceded INTEGER NOT NULL,
    wickets_taken INTEGER NOT NULL,
    dot_balls INTEGER NOT NULL,
    extras_conceded INTEGER NOT NULL,
    overs_bowled NUMERIC(6,1),
    bowling_average NUMERIC(6,2),
    economy_rate NUMERIC(5,2),
    strike_rate NUMERIC(6,2),
    four_wickets INTEGER DEFAULT 0,
    five_wickets INTEGER DEFAULT 0,
    innings_bowled INTEGER NOT NULL
);

CREATE INDEX idx_bowler_wickets ON bowler_stats(wickets_taken DESC);
CREATE INDEX idx_bowler_average ON bowler_stats(bowling_average ASC);
CREATE INDEX idx_bowler_economy ON bowler_stats(economy_rate ASC);