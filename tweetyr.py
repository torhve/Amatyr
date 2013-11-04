#!/usr/bin/env python
# -*- coding: UTF-8
'''
A simple twitter client that posts current weather to twitter
'''
import tweepy
import json
from urllib2 import urlopen
import os
import sys

root = os.path.dirname(os.path.abspath(__file__))
conf = json.loads(file(root+'/twitterconfig.json').read())

auth = tweepy.OAuthHandler(conf['consumerkey'], conf['consumersecret'])
auth.set_access_token(conf['accesstoken'], conf['accesssecret'])

api = tweepy.API(auth)

w = json.loads(urlopen(conf['apiurl']).read())[0]

# Fix wind speed
w['windspeed'] = w['windspeed']/3.6
# Fix rain
#w['dayrain'] = w['dayrain']*10


if len(sys.argv) > 1:
    filename = open(conf['snapfile'])
    api.update_status_with_media(filename, status=sys.argv[1] + ' %(outtemp).1f °C, %(windspeed).1f m/s vind, %(dayrain).1f mm nedbør' %w,lat=conf['lat'],long=conf['long'])
else:
    out = []
    out.append('%(outtemp).1f °C' %w)

    ws = w['windspeed']

    if ws > 32:
        out.append('orkan! (%(windspeed).1f m/s)' %w)
    elif ws > 28.5:
        out.append('sterk storm (%(windspeed).1f m/s)' %w)
    elif ws > 24.5:
        out.append('full storm (%(windspeed).1f m/s)' %w)
    elif ws > 20.8:
        out.append('liten storm (%(windspeed).1f m/s)' %w)
    elif ws > 17.2:
        out.append('sterk kuling (%(windspeed).1f m/s)' %w)
    elif ws > 13.9:
        out.append('stiv kuling (%(windspeed).1f m/s)' %w)
    elif ws > 10.8:
        out.append('liten kuling (%(windspeed).1f m/s)' %w)
    elif ws > 8:
        out.append('frisk bris (%(windspeed).1f m/s)' %w)
    elif ws > 5.5:
        out.append('laber bris (%(windspeed).1f m/s)' %w)
    elif ws > 3.4:
        out.append('lett bris (%(windspeed).1f m/s)' %w)
    elif ws > 1.5:
        out.append('svak vind (%(windspeed).1f m/s)' %w)
    elif ws > 0.3:
        out.append('flau vind (%(windspeed).1f m/s)' %w)
    else:
        out.append('vindstille')
    # TODO add text for gusts

    if w['dayrain'] > 0:
        out.append('%(dayrain).1f mm nedbør' %w)

    api.update_status(", ".join(out), lat=conf['lat'], long=conf['long'])
