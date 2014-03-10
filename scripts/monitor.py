#!/usr/bin/python
# -*- coding: UTF-8
# Copyright: 2014 Tor Hveem <thveem>
# License: GPL3
#
# Simple Python script for polling amatyr installation and check latest date
#
# Usage: python monitor.py <AMATYR BASEURL> <EMAIL RECIPIENT>
# Check every 5 minute in crontab:
# */5 * * * * <AMATYRPATH>/scripts/monitor.py
#


import urllib2
from datetime import datetime
import time
import sys
import simplejson
from email.mime.text import MIMEText
from subprocess import Popen, PIPE
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVEFILENAME = os.path.join(BASE_DIR, '.last')

json = urllib2.urlopen('http://%s/api/now'%(sys.argv[1])).read()
json = simplejson.loads(json)

fmt = '%Y-%m-%d %H:%M:%S'

jsontimestamp = json[0]['datetime']
yrtime = datetime.strptime(jsontimestamp, fmt)
now = datetime.now()
time_d =  now - yrtime


# Give it an hour
if time_d.total_seconds() > 3600:
    # Check if we alerted for this timestamp before 
    try:
       oldalert = file(SAVEFILENAME, 'r').read()
       if oldalert == jsontimestamp:
           sys.exit(1)
    except IOError:
       'File does not exist'

    # Save timestamp
    file(SAVEFILENAME, 'w').write(jsontimestamp)

    # Alert.
    msg = MIMEText("Please help me.")
    msg["From"] = "amatyr@%s" %BASEURL
    msg["To"] = sys.argv[2] 
    msg["Subject"] = "AmatYr stopped %s ago" %time_d 
    p = Popen(["/usr/sbin/sendmail", "-t"], stdin=PIPE)
    p.communicate(msg.as_string())

