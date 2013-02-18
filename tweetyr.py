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
    api.update_status('%(outtemp).1f °C, %(windspeed).1f m/s vind, %(dayrain).1f mm nedbør' %w,lat=conf['lat'],long=conf['long'])
