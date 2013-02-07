---
-- SQL specific API view
-- 
-- Copyright Tor Hveem <thveem> 2013
-- 
--
local setmetatable = setmetatable
local ngx = ngx
local string = string
local cjson = require "cjson"
local io = require "io"
local assert = assert
local conf

module(...)

local mt = { __index = _M }

if not conf then
    local f = assert(io.open(ngx.var.document_root .. "/etc/config.json", "r"))
    local c = f:read("*all")
    f:close()

    conf = cjson.decode(c)
end

-- The function sending subreq to nginx postgresql location with rds_json on
-- returns json body to the caller
local function dbreq(sql)
    ngx.log(ngx.ERR, 'SQL: ' .. sql)
    local dbreq = ngx.location.capture("/pg", { args = { sql = sql } })
    local json = dbreq.body
    return json
end

function max(match)
    local key = ngx.req.get_uri_args()['key']
    if not key then ngx.exit(403) end
    -- Make sure valid request, only accept plain lowercase ascii string for key name
    keytest = ngx.re.match(key, '[a-z]+', 'oj')
    if not keytest then ngx.exit(403) end

    local sql = "SELECT date_trunc('day', timestamp) AS timestamp, MAX("..key..") AS "..key.." FROM "..conf.db.name.." WHERE date_part('year', timestamp) < 2013 GROUP BY 1"
    
    return dbreq(sql)
end

function now(match)
    local sql = "SELECT * FROM "..conf.db.name.." ORDER BY timestamp DESC LIMIT 1"
    
    return dbreq(sql)
end

function recent(match)
    local sql = "SELECT * FROM "..conf.db.name.." ORDER BY timestamp DESC LIMIT 50"
    return dbreq(sql)
end

function record(match)

    local key = match[1]
    local func = string.upper(match[2])

    local where = ''
    local andwhere = ''
    local year = ngx.req.get_uri_args()['start']
    if year then 
        local start
        local endpart = "365 days"
        if string.upper(year) == 'TODAY' then
            start = "CURRENT_DATE" 
            -- XXX fixme, use postgresql function
        elseif string.upper(year) == 'WEEK' then
            start = "date(date_trunc('week', current_timestamp))"
            endpart = '1 week'
        elseif string.upper(year) == 'MONTH' then
            start = "to_date( to_char(current_date,'yyyy-MM') || '-01','yyyy-mm-dd')" 
            endpart = '1 month'
        else
            start = "DATE '" .. year .. "-01-01'"
        end
        local wherepart = [[
        (
            timestamp BETWEEN ]]..start..[[
            AND 
            ]]..start..[[ + INTERVAL ']]..endpart..[['
        )
        ]]
        where = 'WHERE ' .. wherepart
        andwhere = 'AND ' .. wherepart
    end

    local sql = dbreq([[
        SELECT
            timestamp, 
            ]]..key..[[
        FROM ]]..conf.db.name..[[ 
        WHERE
        ]]..key..[[ = (
            SELECT 
                ]]..func..[[(]]..key..[[) 
                FROM ]]..conf.db.name..[[
                ]]..where..[[
                LIMIT 1 
            )
        ]]..andwhere..[[
        LIMIT 1
        ]])
    
    return sql
end

function index()
    local sql = dbreq([[
    SELECT  
        date_trunc('hour', timestamp) AS timestamp,
        AVG(temp) as temp,
        MIN(temp) as tempmin,
        MAX(temp) as tempmax,
        AVG(daily_rain) as daily_rain,
        AVG(avg_speed) as avg_speed,
        AVG(winddir) as winddir,
        AVG(barometer) as barometer
    FROM ]]..conf.db.name..[[ 
    WHERE timestamp 
        BETWEEN now() - INTERVAL '3 days'
        AND now()
    GROUP BY 1
    ORDER BY 1
    ]])
    return sql
end

function day(match)
    --- XXX support for day as arg
    --- current day for now
    local sql = dbreq([[
    SELECT  
        *,
        temp as tempmin,
        temp as tempmax
    FROM ]]..conf.db.name..[[ 
    WHERE timestamp 
        BETWEEN CURRENT_DATE
        AND CURRENT_DATE + INTERVAL '1 day'
    ORDER BY timestamp
    ]])
    return sql
end

function year(match)
    local year = match[1]
    local syear = year .. '-01-01'
    local json = dbreq([[
        SELECT 
            date_trunc('day', timestamp) AS timestamp,
            AVG(temp) as temp,
            MIN(temp) as tempmin,
            MAX(temp) as tempmax,
            MAX(daily_rain) as daily_rain,
            AVG(avg_speed) as avg_speed,
            AVG(winddir) as winddir,
            AVG(barometer) as barometer
        FROM ]]..conf.db.name..[[ 
        WHERE timestamp BETWEEN DATE ']]..syear..[['
        AND DATE ']]..syear..[[' + INTERVAL '365 days'
        GROUP BY 1
        ORDER BY 1
        ]])
    return json
end

local class_mt = {
    -- to prevent use of casual module global variables
    __newindex = function (table, key, val)
        error('attempt to write to undeclared variable "' .. key .. '"')
    end
}

setmetatable(_M, class_mt)
