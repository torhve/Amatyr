/* Rivets formatters */
rivets.formatters.temp = function(value) {
    return value + ' °C';
}
rivets.formatters.pressure = function(value) {
    return value + ' hPa';
}
rivets.formatters.rain = function(value) {
    return value + ' mm';
}
rivets.formatters.wind = function(value) {
    return value + ' kn';
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
        drawbars(target, source, key, null, null, legend, width, height);
    });

}

/* Initial and on resize we draw draw draw */
on_resize(function() {

    // Fetch new json data
    d3.json("/api/", function(source) { 
        /* First remove any existing svg */
        $('#main svg').remove();

        // Get the last element and populate rivets bindings with it
        rivets.bind(document.getElementById('main'), {current: source.slice(-1)[0]});

        var colorscale = function(d, attr) {
            return "darkred";
            return "steelblue";
        };
        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        source.forEach(function(d) {
            d.date = parseDate(d.timestamp);
        });
        var width = $('#main').css('width').split('px')[0];
        var height = 180;

        drawlines('#temp', source, 'temp', colorscale, 'Temperature (°C)', width, height);
        drawlines('#pressure', source, 'barometer',colorscale,  'Air pressure (hPa)', width, height);
        drawlines('#wind', source, 'avg_speed', colorscale, 'Average wind speed (knot)', width, height);
        drawlines('#rain', source, 'daily_rain',colorscale,  'Daily rain (mm)', width, height);
        bartender('#rain', 'daily_rain', 'Daily Rain', width, height);
        bartender('#temp', 'temp', 'Daily Max Temp', width, height);
        bartender('#wind', 'avg_speed', 'Daily Max Wind', width, height);

    });
})(); // these parenthesis does the trick

// debulked onresize handler
function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};
//
