#!/usr/bin/python
# -*- coding: UTF-8
# Author Tor Hveem <thveem>
#
# Simple Python to parse Davis Vantage weather station log
#

import datetime
import psycopg2
import time
import sys
import re

'''day month year hour minute temperature   humidity     dewpoint   barometer    windspeed   gustspeed direction  rainlastmin    dailyrain  monthlyrain   yearlyrain  heatindex
 1  9 2012  0  0 10.1  90 08.5 1021.2 3.6 5.2 144 0.0 0.0 154.4 1240.2 10.1
 '''

pg_weather = psycopg2.connect("dbname='yr' user='yr' host='localhost' password='amatyr'")
pg_weather_cursor = pg_weather.cursor()

fh = file(sys.argv[1])
fieldnames = []
values = []
for i, line in enumerate(fh.readlines()):
    fields = re.split(r'\s*', line.strip())
    if i == 0:
        fieldnames = fields
        continue
    r = {}
    for j, fieldname in enumerate(fieldnames):
        ffunc = float
        if fieldname in ('year', 'month', 'day', 'hour','minute'):
            ffunc = int
        try:
            r[fieldname] = ffunc(fields[j].strip().replace('\x00', ''))
        except Exception, e:
            print "Line with problem:", i
            print e
            print fields
            break
    timestamp = '%04d-%02d-%02d %02d:%02d:%02d' %(r['year'], r['month'], r['day'], r['hour'], r['minute'], 0)
    weather_insert = "INSERT INTO wd (timestamp, avg_speed, gusts, winddir, temp, hum, barometer, daily_rain, dew_temp, cloud_height) VALUES ('{0}', {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, 0)".format(timestamp, r['windspeed'], r['gustspeed'], r['direction'], r['temperature'], r['humidity'], r['barometer'], r['dailyrain'], r['dewpoint'])
    try:
        pg_weather_cursor.execute(weather_insert)
        pg_weather.commit()
    except psycopg2.IntegrityError, i:
        print i
        print r
        pg_weather.rollback()
    except psycopg2.InternalError, i:
        print i
        print r

#weather_insert = "INSERT INTO wd (timestamp, avg_speed, gusts, winddir, temp, hum, barometer, daily_rain, dew_temp, cloud_height) VALUES ('{0}', {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9})".format(timestamp, avg_speed, gusts, winddir, temp, hum, barometer, daily_rain, dew_temp, cloud_height)
#
pg_weather.close()

