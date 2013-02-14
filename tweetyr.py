#!/usr/bin/env python
# -*- coding: UTF-8
'''
A simple twitter client that posts current weather to twitter
'''
import tweepy
import json
from urllib2 import urlopen
import os

root = os.path.dirname(os.path.abspath(__file__))
conf = json.loads(file(root+'/twitterconfig.json').read())

auth = tweepy.OAuthHandler(conf['consumerkey'], conf['consumersecret'])
auth.set_access_token(conf['accesstoken'], conf['accesssecret'])

api = tweepy.API(auth)

w = json.loads(urlopen(conf['apiurl']).read())[0]

# Fix wind speed
w.windspeed = w.windspeed/3.6

api.update_status('%(outtemp).1f °C, %(windspeed).1f m/s vind, %(rain).1f mm nedbør' %w,lat=conf['lat'],long=conf['long'])
