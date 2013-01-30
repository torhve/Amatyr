/* Rivets formatters */
rivets.formatters.temp = function(value) {
    return Number((value).toFixed(1))+ ' °C';
}
rivets.formatters.pressure = function(value) {
    return Number((value).toFixed(1)) + ' hPa';
}
rivets.formatters.rain = function(value) {
    return Number((value).toFixed(1)) + ' mm';
}
rivets.formatters.wind = function(value) {
    return Number((value).toFixed(1)) + ' kn';
}
rivets.formatters.degree = function(value) {
    return Number((value).toFixed(1)) + ' °';
}

/* Configure Rivets to work with Watch JS */
rivets.configure({
  adapter: {
          subscribe: function(obj, keypath, callback) {
                    watch(obj, keypath, callback)
    },
    unsubscribe: function(obj, keypath, callback) {
              unwatch(obj, keypath, callback)
    },
    read: function(obj, keypath) {
              return obj[keypath]
    },
    publish: function(obj, keypath, value) {
              obj[keypath] = value
    }
  }
})

// Helps out with the bars
var bartender = function(target, key, legend, width, height) {
    // Fetch new json data
    d3.json("/api/max?key="+key, function(source) { 
        
        valfmt = function(d) { return d.val }
        if (key == 'temp') {
            valfmt = function(d) { 
                return rivets.formatters.temp(d.val)
            }
        }
        else if (key == 'daily_rain') {
            valfmt = function(d) { 
                return rivets.formatters.rain(d.val)
            }
        }
        else if (key == 'avg_speed') {
            valfmt = function(d) { 
                return rivets.formatters.wind(d.val)
            }
        }
        else if (key == 'wind') {
            valfmt = function(d) { 
                return rivets.formatters.wind(d.val)
            }
        }
        drawbars(target, source, key, null, valfmt, legend, width, height);
    });

}

var fetch_and_draw = function() {
    // Fetch new json data
    d3.json(apiurl, function(source) { 
        console.log(source);
        /* First remove any existing svg */
        $('#main svg').remove();
        /* Remove any spinners */
        $('.svgholder').empty();

        // Get the last element and populate rivets bindings with it
        rivets.bind(document.getElementById('main'), {current: source.slice(-1)[0]});

        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        source.forEach(function(d) {
            d.date = parseDate(d.timestamp);
        });
        var width = $('#main').css('width').split('px')[0];
        var height = 180;

        /* Line graphs */
        drawlines('#temp', source, 'temp', xformat, 'Temperature (°C)', width, height);
        drawlines('#pressure', source, 'barometer',xformat,  'Air pressure (hPa)', width, height);
        drawlines('#wind', source, 'avg_speed', xformat, 'Average wind speed (knot)', width, height);
        drawlines('#rain', source, 'daily_rain',xformat,  'Daily rain (mm)', width, height);
        drawlines('#winddir', source, 'winddir',xformat,  'Daily wind direction (°)', width, height);
        /* Bar graphs */
        /*
        bartender('#rain', 'daily_rain', 'Daily Rain', width, height);
        bartender('#temp', 'temp', 'Daily Max Temp', width, height);
        bartender('#wind', 'avg_speed', 'Daily Max Wind', width, height);
        */


    });
}



var apiurl = "/api/";
var xformat = d3.time.format("%Y-%m-%d %H:%M")


/* Initial hash and on resize hash change */
var on_hashchange = function() {
    var loc =  window.location.hash.split('/')
    console.log(loc);

    if(loc.length > 1) {
        apiurl += loc[1] + '/' + loc[2]
        xformat = d3.time.format("%Y-%m-%d")
    }

    // Trigger fetch and draw
    fetch_and_draw();

};


/* Initial and on resize we draw draw draw */
on_resize(function() {
    fetch_and_draw();
})(); // these parenthesis does the trick

// debulked onresize handler
function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};

// on hash change handler
window.onhashchange = function(){ on_hashchange() };

// Initial
on_hashchange();

// Tooltip
var tt = document.createElement('div'),
  leftOffset = -(~~$('html').css('padding-left').replace('px', '') + ~~$('body').css('margin-left').replace('px', '')),
  topOffset = -32;
tt.className = 'ex-tooltip';
document.body.appendChild(tt);
