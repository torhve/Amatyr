local redis = require "resty.redis"
local cjson = require "cjson"
local tirtemplate = require "tirtemplate"
local conf

-- use nginx $root variable for template dir, needs trailing slash
TEMPLATEDIR = ngx.var.root .. '/';

if not conf then
    local f = assert(io.open(ngx.var.document_root .. "/etc/config.json", "r"))
    local c = f:read("*all")
    f:close()

    conf = cjson.decode(c)
end

-- 
-- Index view
--
local function index()

    local page = tirtemplate.tload('index.html')
    local context = { conf=conf }
    ngx.print( page(context) )
end


--
-- Webcam view
--
local function cam()

    local page = tirtemplate.tload('cam.html')
    local context = { conf=conf }
    ngx.print( page(context) )
end


-- mapping patterns to views
local routes = {
    ['cam']       = cam,
    ['(.*)$']     = index,
}
-- Set the content type
ngx.header.content_type = 'text/html';

local BASE = '/'
-- iterate route patterns and find view
for pattern, view in pairs(routes) do
    local uri = '^' .. BASE .. pattern
    local match = ngx.re.match(ngx.var.uri, uri, "") -- regex mather in compile mode
    if match then
        exit = view(match) or ngx.HTTP_OK
        ngx.exit( exit )
    end
end
-- no match, return 404
ngx.exit( ngx.HTTP_NOT_FOUND )
