CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    match_id TEXT,
    match_date DATE,
    city TEXT,
    venue TEXT,
    batting_team TEXT,
    over_number INT,
    batter TEXT,
    bowler TEXT,
    runs_batter INT,
    runs_total INT,
    is_boundary BOOLEAN,
    is_dot_ball BOOLEAN,
    player_out TEXT
);