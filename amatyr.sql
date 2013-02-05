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
create index daily_rain_idx on wd(daily_rain);
create index barometer_idx on wd(barometer);
create index gusts_idx on wd(gusts);
create index avg_speed_idx on wd(avg_speed);
create index temp_idx on wd(temp);

