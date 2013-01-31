CREATE TABLE "wd" (
    "id" serial NOT NULL,
    "timestamp" timestamp UNIQUE,
    "avg_speed" real NOT NULL,
    "gusts" real NOT NULL,
    "winddir" smallint NOT NULL,
    "temp" real NOT NULL,
    "hum" smallint NOT NULL,
    "barometer" real NOT NULL,
    "daily_rain" real NOT NULL,
    "dew_temp" real NOT NULL,
    "cloud_height" real NOT NULL,
    "rain_rate" real NOT NULL
);

