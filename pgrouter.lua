-- 
-- A simple API adapter for using postgresql internal subreq in a reusable manner
--
-- Copyright Tor Hveem <thveem> 2013
--

local cjson = require "cjson"
local string = require "string"

-- Load our API commands
local api = require "api"


-- mapping patterns to query views
local routes = {
    ['max']               = api.max,
    ['record/([a-z_]+)/([a-z]+)']= api.record,
    ['year/([0-9]{4})']   = api.year,
    ['now']               = api.now,
    ['day']               = api.day,
    ['recent']            = api.recent,
    ['$']                 = api.index,
}
-- Set the content type
ngx.header.content_type = 'application/json';
-- Our URL base, must match location in nginx config
local BASE = '/api/'
-- iterate route patterns and find view
for pattern, view in pairs(routes) do
    local uri = '^' .. BASE .. pattern
    local match = ngx.re.match(ngx.var.uri, uri, "oj") -- regex mather in compile mode
    if match then
        local ret, exit = view(match) 
        -- Print the returned json
        ngx.print(ret)
        -- If not given exit, then assume OK
        if not exit then exit = ngx.HTTP_OK end
        -- Exit with returned exit value
        ngx.exit( exit )
    end
end
-- no match, return 404
ngx.exit( ngx.HTTP_NOT_FOUND )
