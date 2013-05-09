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
local pg = require "resty.postgres" -- https://github.com/azurewang/lua-resty-postgres
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

local function dbreq(sql)
    local db = pg:new()
    db:set_timeout(3000)
    local ok, err = db:connect(
        {
            host=conf.db.host,
            port=5432, 
            database=conf.db.database, 
            user=conf.db.user,
            password=conf.db.password,
            compact=false
        })
    if not ok then
        ngx.say(err)
    end
    ---ngx.log(ngx.ERR, '___ SQL ___'..sql)
    local res, err = db:query(sql)
    db:set_keepalive(0,10)
    return cjson.encode(res)
end

-- The function sending subreq to nginx postgresql location with rds_json on
-- returns json body to the caller
local function odbreq(sql)
    --ngx.log(ngx.ERR, 'SQL: ' .. sql)
    local dbreq = ngx.location.capture("/pg", { args = { sql = sql } })
    local json = dbreq.body
    return json
end

-- Translate front end column names to back end column names
local function column(key)
    return conf.db.columns[key]
end

function max(match)
    local key = ngx.req.get_uri_args()['key']
    if not key then ngx.exit(403) end
    -- Make sure valid request, only accept plain lowercase ascii string for key name
    local keytest = ngx.re.match(key, '[a-z]+', 'oj')
    if not keytest then ngx.exit(403) end

    local sql = "SELECT date_trunc('day', datetime) AS datetime, MAX("..key..") AS "..key.." FROM "..conf.db.table.." WHERE date_part('year', datetime) < 2013 GROUP BY 1"
    
    return dbreq(sql)
end

-- Latest record in db
function now(match)
    return dbreq([[SELECT 
    *,
    (
        SELECT SUM(rain) 
        FROM ]]..conf.db.table..[[ 
        WHERE datetime >= CURRENT_DATE
    )
    AS dayrain
    FROM ]]..conf.db.table..[[
    ORDER BY datetime DESC LIMIT 1]])
end

-- Last 60 samples from db
function recent(match)
    return dbreq([[SELECT 
    *,
    SUM(rain) OVER (ORDER by datetime) AS dayrain
    FROM ]]..conf.db.table..[[
    ORDER BY datetime DESC 
    LIMIT 60]])
end

-- Helper function to get a start argument and return SQL constrains
local function getDateConstrains(startarg)
    local where = ''
    local andwhere = ''
    if startarg then 
        local start
        local endpart = "365 days"
        if string.upper(startarg) == 'TODAY' then
            start = "CURRENT_DATE" 
            -- XXX fixme, use postgresql function
        elseif string.lower(startarg) == 'yesterday' then
            start = "DATE 'yesterday'" 
            endpart = '1 days'
        elseif string.upper(startarg) == '3DAY' then
            start = "NOW() - INTERVAL '3 days'"
            endpart = '3 days'
        elseif string.upper(startarg) == 'WEEK' then
            start = "date(date_trunc('week', current_timestamp))"
            endpart = '1 week'
        elseif string.upper(startarg) == 'MONTH' then
            -- old used this month, new version uses last 30 days
            --start = "to_date( to_char(current_date,'yyyy-MM') || '-01','yyyy-mm-dd')" 
            start = "CURRENT_DATE - INTERVAL '1 MONTH'"
            endpart = "1 MONTH"
        else
            start = "DATE '" .. startarg .. "-01-01'"
        end
        local wherepart = [[
        (
            datetime BETWEEN ]]..start..[[
            AND 
            ]]..start..[[ + INTERVAL ']]..endpart..[['
        )
        ]]
        where = 'WHERE ' .. wherepart
        andwhere = 'AND ' .. wherepart
    end
    return where, andwhere
end

-- Function to return extremeties from database, min/maxes for different time intervals
function record(match)

    local key = match[1]
    local func = string.upper(match[2])
    local where, andwhere = getDateConstrains(ngx.req.get_uri_args()['start'])
    local sql

    -- Special handling for rain since it needs a sum
    if key == 'dayrain' and func == 'MAX' then
        -- Not valid with any other value than max
        sql = [[
        SELECT 
        distinct date_trunc('day', datetime) AS datetime, 
        SUM(rain) OVER (PARTITION BY date_trunc('day', datetime)) AS dayrain 
        FROM ]]..conf.db.table..[[
        ]]..where..[[
        ORDER BY dayrain DESC
        LIMIT 1
        ]]
    elseif func == 'SUM' then
        -- The SUM part doesn't need the datetime of the record since the datetime is effectively over the whole scope
        sql = [[
            SELECT 
            SUM(]]..key..[[) AS ]]..key..[[ 
            FROM ]]..conf.db.table..[[
            ]]..where..[[
        ]]
    else
        sql = [[
        SELECT
            datetime, 
            ]]..key..[[
        FROM ]]..conf.db.table..[[ 
        WHERE
        ]]..key..[[ = 
        (
            SELECT 
                ]]..func..[[(]]..key..[[) 
            FROM ]]..conf.db.table..[[
            ]]..where..[[
            LIMIT 1 
        )
        ]]..andwhere..[[
        LIMIT 1
        ]]
    end
    
    return dbreq(sql)
end

--- Return weather data by hour, week, month, year, whatever..
function by_dateunit(match)
    local unit = 'hour'
    if match[1] then
        if match[1] == 'month' then
            unit = 'day'
        end
    elseif ngx.req.get_uri_args()['start'] == 'month' then
        unit = 'day'
    end
    -- get the date constraints
    local where, andwhere = getDateConstrains(ngx.req.get_uri_args()['start'])
    local sql = dbreq([[
    SELECT  
        date_trunc(']]..unit..[[', datetime) AS datetime,
        AVG(outtemp) as outtemp,
        MIN(outtemp) as tempmin,
        MAX(outtemp) as tempmax,
        AVG(dewpoint) as dewpoint,
        AVG(rain) as rain,
        MAX(b.dayrain) as dayrain,
        AVG(windspeed) as windspeed,
        MAX(windgust) as windgust,
        AVG(winddir) as winddir,
        AVG(barometer) as barometer,
        AVG(outhumidity) as outhumidity,
        AVG(intemp) as intemp,
        AVG(inhumidity) as inhumidity,
        AVG(heatindex) as heatindex,
        AVG(windchill) as windchill
    FROM ]]..conf.db.table..[[ as a
    LEFT OUTER JOIN (
        SELECT DISTINCT 
            date_trunc(']]..unit..[[', datetime) AS unit, 
            SUM(rain) OVER (PARTITION BY date_trunc('day', datetime) ORDER by datetime) AS dayrain 
        FROM ]]..conf.db.table..[[ ]]..where..[[ 
        ORDER BY 1
    ) AS b
    ON a.datetime = b.unit
    ]]..where..[[
    GROUP BY 1
    ORDER BY datetime
    ]])
    return sql
end

function day(match)
    local where, andwhere = getDateConstrains(ngx.req.get_uri_args()['start'])
    local sql = dbreq([[
    SELECT  
        *,
        SUM(rain) OVER (ORDER by datetime) AS dayrain
    FROM ]]..conf.db.table..[[ 
    ]]..where..[[
    ORDER BY datetime
    ]])
    return sql
end

function year(match)
    local year = match[1]
    local syear = year .. '-01-01'
    local where = [[
        WHERE datetime BETWEEN DATE ']]..syear..[['
        AND DATE ']]..syear..[[' + INTERVAL '365 days'
    ]]
    local json = dbreq([[
        SELECT 
            date_trunc('day', datetime) AS datetime,
            AVG(outtemp) as outtemp,
            MIN(outtemp) as tempmin,
            MAX(outtemp) as tempmax,
            AVG(dewpoint) as dewpoint,
            AVG(rain) as rain,
            MAX(b.dayrain) as dayrain,
            AVG(windspeed) as windspeed,
            MAX(windgust) as windgust,
            AVG(winddir) as winddir,
            AVG(barometer) as barometer,
            AVG(outhumidity) as outhumidity,
            AVG(outhumidity) as outhumidity,
            AVG(intemp) as intemp,
            AVG(inhumidity) as inhumidity,
            AVG(heatindex) as heatindex,
            AVG(windchill) as windchill
        FROM ]]..conf.db.table..[[ AS a
        LEFT OUTER JOIN 
        (
            SELECT 
                DISTINCT date_trunc('day', datetime) AS hour, 
                SUM(rain) OVER (PARTITION BY date_trunc('day', datetime) ORDER by datetime) AS dayrain 
                FROM ]]..conf.db.table..' '..where..[[ ORDER BY 1
        ) AS b
        ON a.datetime = b.hour
        ]]..where..[[
        GROUP BY 1
        ORDER BY datetime
        ]])
    return json
end

function windhist(match)
    local where, andwhere = getDateConstrains(ngx.req.get_uri_args()['start'])
    return dbreq([[
        SELECT count(*), ((winddir/10)::int*10)+0 as d, avg(windspeed)*0.539956803  as avg
        FROM ]]..conf.db.table..[[ 
        ]]..where..[[
        GROUP BY 2
        ORDER BY 2
    ]])
end

local class_mt = {
    -- to prevent use of casual module global variables
    __newindex = function (table, key, val)
        ngx.log(ngx.ERR, 'attempt to write to undeclared variable "' .. key .. '"')
    end
}

setmetatable(_M, class_mt)
