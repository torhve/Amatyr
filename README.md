# AmatYr

A weather display with a JavaScript frontend and Postgresql + Lua backend.

### Frontend Components

-    jQuery
-    D3js
-    Rivetsjs
-    WatchJS
-    Bootstrap

### Backend Components

-   Python datapoller
-   Openresty (nginx + luajit)
-   PostgreSQL


### Installation

1. Clone repostory
1. Add bootstrap resources
1. Add fontawesome resources
1. Compile and install openresty
    [Openresty](http://openresty.org)
1. Set up postgresql database with user
    createdb yr ...
1. Set up the datalogger
    Cronjob wdparser.py
1. Set up nginx:


    upstream database {
        postgres_server 127.0.0.1 dbname=yr user=yr password=yr;
    }
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

        location / { try_files $uri @lua; }
        location @lua {
           lua_code_cache off;
           content_by_lua_file $root/amatyr.lua;
        }

        location /pg {
        internal;
            postgres_pass database;
        set_by_lua $sql 'return ngx.unescape_uri(ngx.var.arg_sql)';
        postgres_query $sql;
            rds_json          on;
        }
    }
