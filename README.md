# AmatYr

AmatYr is a personal weather station display software project.

The software is a modern HTML5 "single page app" using JavaScript to fetch data from SQL via JSON from Postgresql + Lua backend. Then the data is transformed into pretty visualizations by the brilliant (D3.js)[http://d3js.org] library, giving the data life!

Primary goal of the project is bringing modern and responsive design, suitable for desktop, tablet and mobile-sized screens. A secondary goal is just playing with new technology because it's fun :-) And I guess a goal is to display some pretty graphs and such for local weather!

### Frontend Components

-    D3 js
-    jQuery
-    Rivets js
-    Watch js
-    Path js 
-    Wind rose chart from [Windhistory.com](http://windhistory.com/about.html)
-    Bootstrap css + js
-    Cal-Heatpmap from Wan Qi Chen <http://kamisama.github.io/cal-heatmap/>


### Backend Components

-   Openresty (nginx + luajit)
-   PostgreSQL


### Getting weather data into SQL

The frontend is somewhat loosely coupled with the backend, but it fetches data via JSON from the backend, so to get data displayed it must be accessible in that manner. There's 3 different ways to achieve that. Use one of these methods:

-    Included with the project is a small python utility to read Davis Vantage .txt-logs and insert into SQL (davislogparser.py)
-    Inlucded with the project is a smal python utility to read the output from Weather Display Live and insert into SQL (wdparser.py)
-    Included is a patch (scripts/weewx-2.1.1.postgresql.patch) for (Weewx)[http://weewx.com] to be able to store data in PostgreSQL.

### Installation of the frontend

1. Clone this repostory
1. Add bootstrap resources
1. Add fontawesome resources
1. Compile and install openresty, with LuaJit and Postgresql support.
    Grab source at [Openresty](http://openresty.org)

Run:

    ./configure --with-luajit  --with-http_addition_module --with-http_dav_module --with-http_geoip_module --with-http_gzip_static_module --with-http_image_filter_module --with-http_realip_module --with-http_stub_status_module --with-http_ssl_module --with-http_sub_module --with-http_xslt_module --with-ipv6 --with-http_postgres_module

And follow Openresty's own installation docs.

1. Configure postgresql
1. Configure the virtual host for nginx like this:

    lua_package_path '/home/yr/amatyr/?.lua;;';

    server {
        listen	*:80;
        server_name  yr.no;

        set $root /home/yr/amatyr/;
        root   $root;
        access_log /home/yr/amatyr/access.log;
        error_log /home/yr/amatyr/error.log;

        location /api {
           lua_code_cache off;
           content_by_lua_file $root/pgrouter.lua;
        }
        location /static {
            root $root;
        }

        location / { try_files $uri @lua; }
        location @lua {
           lua_code_cache off;
           content_by_lua_file $root/amatyr.lua;
        }
    }

1. Install the resty postgresql driver from <https://github.com/azurewang/lua-resty-postgres>
    One simple way to do this is put the postgres.lua in the default openresty folder:

    wget -O /usr/local/openresty/lualib/resty/postgres.lua  https://github.com/azurewang/lua-resty-postgres/raw/master/lib/resty/postgres.lua

### Live demo

My personal installation of this project is running at <http://yr.hveem.no>
It has a blog post to go with the setup at <http://hveem.no/raspberry-pi-davis-vue-weather-station-with-custom-frontend>

### License

AmatYr uses a BSD 3-clause license.

    Copyright (c) 2013, Tor Hveem or Project Contributors.
    All rights reserved.

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

    * Neither the name of the AmatYr Project, Tor Hveem, nor the names
      of its contributors may be used to endorse or promote products
      derived from this software without specific prior written
      permission.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
    IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
    THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
    PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
    CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
    EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
    PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

