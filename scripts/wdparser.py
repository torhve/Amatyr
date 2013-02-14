#!/usr/bin/python
# -*- coding: UTF-8
# Author Tor Hveem <thveem>
#
# Simple Python script for polling weather data from a Weather Display web page and inserto into postgresqldb
#


import urllib2
import datetime
import psycopg2
import time
import sys



'''12345 8.7 10.4 226 4.7 63 979.1 0.0 68.6 68.6 0.000 0.000 22.0 35 0.0 5 0.0 0 0 0.0 0.0 255.0 0.0 0.0 -100.0 -100.0 -100 -100 -100 12 20 50 Husnes_Weather-12:20:50 0 0 27 1 100 100 100 100 100 100 100 1.3 2.2 5.6 2.6 5 Overcast_and_gloomy/Dry -1.6 13.0 8.7 7.0 8.7 8.7 5.2 4.3 3.5 4.3 3.5 3.5 4.3 4.3 7.8 4.3 6.1 6.1 12.2 12.2 12.2 27.8 -1.7 2864.3 27/1/2013 3.1 0.2 4.6 -2.5 0.0 3.9 7.2 6.4 8.0 5.1 6.6 8.9 6.1 7.8 6.9 5.4 5.3 5.3 5.2 5.1 5.1 5.0 4.9 4.8 4.7 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 0.0 5.6 2.6 4.7 17.6 0 --- --- 252 0 0 -100.0 -100.0 -100 0 0 0 0 0.0 23.6 20.6 0.4 996.4 978.9 25 11:34 10:25 3.4 -3.5 -0.6 -5.4 17 2013 0.0 -1 1 -1 299 310 340 234 316 293 46 311 289 226 0.0 255.0 7.0 2.4 59.86667 -5.86667 0.0 78 49 0.0 09:51 - - - - - - 126.0 !!C10.37R45!!'''

clientraw = urllib2.urlopen('http://%s/clientraw.txt?nocache=%s'%(sys.argv[1], int(time.time()))).read()
f = clientraw.split(' ')

avg_speed = f[1] * 1.85200 # knot to km/h
gusts = f[2] * 1.85200     # knot to km/h
winddir = f[3]
temp = f[4]
hum = f[5]
barometer = f[6]
daily_rain = f[7]
rain_rate = f[10]
dew_temp = f[72]
cloud_height = float(f[73]) / 3.2808
##
#in_temp = f[12]
hour = int(f[29])
minute = int(f[30])
seconds = int(f[31])
day = int(f[35])
month = int(f[36])
year = int(f[141])

#timestamp = int(time.mktime((year, month, day, hour, minute, seconds, 0, 0, 0)))
timestamp = '%s-%s-%s %s:%s:%s' %(year, month, day, hour, minute, seconds)



pg_weather = psycopg2.connect("dbname='yr' user='yr' host='localhost' password='amatyr'")
pg_weather_cursor = pg_weather.cursor()
weather_insert = "INSERT INTO wd (datetime, windspeed, windgust, winddir, outtemp, outhumidity, barometer, rainrate, rain, dewpoint, cloud_height) VALUES ('{0}', {1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}, 0)".format(timestamp, avg_speed, gusts, winddir, temp, hum, barometer, rain_rate, daily_rain, dew_temp)
pg_weather_cursor.execute(weather_insert)

pg_weather.commit()
pg_weather.close()

