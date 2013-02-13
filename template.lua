--
-- template (C) Tor Hveem
--
-- License: BSD 3-clause : http://tir.mongrel2.org/wiki/license.html
local tir = require "tir"
local ngx = require "ngx"
local assert = assert

module(...)

-- use nginx $root variable for template dir, needs trailing slash
TEMPLATEDIR = ngx.var.root .. '/';

-- Return loaded template
function tload(name)
    local tempf = tir.load_file(TEMPLATEDIR .. name)
    assert(tempf, "Template " .. name .. " does not exist.")
    return tir.compile_view(tempf, name)
end

local mt = { __index = _M }
