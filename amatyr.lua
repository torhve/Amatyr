local redis = require "resty.redis"
local cjson = require "cjson"
local markdown = require "markdown"
local tirtemplate = require('tirtemplate')

-- use nginx $root variable for template dir, needs trailing slash
TEMPLATEDIR = ngx.var.root .. '/';

-- 
-- Index view
--
local function index()

    local page = tirtemplate.tload('index.html')
    local context = { }
    -- render template with counter as context
    -- and return it to nginx
    ngx.print( page(context) )
end

--
-- blog view for a single post
--
local function blog(match)
    local page = match[1] 
    local mdfiles = get_posts()
    local mdcurrent = nil
    for i, mdfile in pairs(mdfiles) do
        if page..'.md' == mdfile then
            mdcurrent = mdfile
            break
        end
    end
    -- No match, return 404
    if not mdcurrent then
        return ngx.HTTP_NOT_FOUND
    end
    
    local mdfile =  BLAGDIR .. mdcurrent
    local mdfilefp = assert(io.open(mdfile, 'r'))
    local mdcontent = mdfilefp:read('*a')
    mdfilefp:close()
    local mdhtml = markdown(mdcontent) 
    local gitdate = file2gitci(BLAGDIR, mdcurrent)
    -- increment visist counter
    local counter, err = red:incr(page..":visit")

    -- Get more posts to be linked
    local posts = posts_with_dates(5)

    local ctx = {
        created = ngx.http_time(gitdate[1]),
        content = mdhtml,
        title = filename2title(mdcurrent),
        posts = posts,
        counter = counter,
    } 
    local template = tirtemplate.tload('blog.html')
    ngx.print( template(ctx) )

end

-- mapping patterns to views
local routes = {
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
