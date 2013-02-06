/* Pad helper */
Number.prototype.pad = function (len) {
        return (new Array(len+1).join("0") + this).slice(-len);
}
/* Rivets formatters */
rivets.formatters.temp = function(value) {
    if(!value)
        return '';
    if (value != undefined) 
        return Number((value).toFixed(1))+ ' °C';
}
rivets.formatters.pressure = function(value) {
    if (value)
        return Number((value).toFixed(1)) + ' hPa';
}
rivets.formatters.rain = function(value) {
    if(value)
        return Number((value).toFixed(1)) + ' mm';
    return '0 mm';
}
rivets.formatters.wind = function(value) {
    if (value)
        return Number((value).toFixed(1)) + ' kn' + ' ' + Number(value*0.51444).toFixed(1) + ' m/s';
}
rivets.formatters.degree = function(value) {
    return Number((value).toFixed(1)) + ' °';
}
rivets.formatters.percent = function(value) {
    return Number((value).toFixed(0)) + ' %';
}
rivets.formatters.rotate = function(value) {
    return 'display:inline-block;-o-transform: rotate('+value+'deg);-ms-transform: rotate('+value+'deg);-mos-transform: rotate('+value+'deg);-webkit-transform: rotate('+value+'deg);'
}
rivets.formatters.date = function(date) {
    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
    var date = parseDate(date);
    return date.getHours().pad(2) + ':' + date.getMinutes().pad(2);
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
});

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

var draw = function(source, xformat) {
    gsource = source;
    //console.log('Current dataset', source);
    /* First remove any existing svg */
    $('#main svg').remove();
    /* Remove any spinners */
    $('.svgholder').empty();

    // Get the last element and populate rivets bindings with it
    rivets.bind(document.getElementById('main'), {
        current: source.slice(-1)[0],
        first: source.slice(0)[0]
    });

    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    source.forEach(function(d) {
        d.date = parseDate(d.timestamp);
    });
    var width = $('#main').css('width').split('px')[0];
    var height = width/4;

    /* Line graphs */
    temprain('#temp', source, 'temp', xformat, 'Temperature (°C)', width, height);
    drawlines('#pressure', source, 'barometer',xformat,  'Air pressure (hPa)', width, height);
    drawlines('#wind', source, 'avg_speed', xformat, 'Average wind speed (knot)', width, height);
    /* Disable rain graph as it is part of temp graph now
    drawlines('#rain', source, 'daily_rain',xformat,  'Daily rain (mm)', width, height);
    */
    drawlines('#winddir', source, 'winddir',xformat,  'Daily wind direction (°)', width, height);
    /* Bar graphs */
    /*
    bartender('#rain', 'daily_rain', 'Daily Rain', width, height);
    bartender('#temp', 'temp', 'Daily Max Temp', width, height);
    bartender('#wind', 'avg_speed', 'Daily Max Wind', width, height);
    */
}

var redraw = function() {
    draw(currentsource, xformat);
}

var apiurl = "/api/";
var currentsource = false;
var xformat = false;
var current_weather;

/* Initial and on resize we draw draw draw */
on_resize(function() {
    redraw();
}); // these parenthesis does the trick

// debulked onresize handler
function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};

// Register HTML5 push state handler for navbar links
$(".navbar a").bind("click", function(event){
    event.preventDefault();
    // Fix active link
    $('.navbar li.active').removeClass('active');
    $(this).closest('li').addClass('active');

    // Call path state to handle the clicked link
    Path.history.pushState({}, "", $(this).attr("href"));
});

Path.map("/year/:year").to(function(){
    var year = this.params['year'];
    // save to global for redraw purpose
    xformat = d3.time.format("%Y-%m-%d")
    var yearurl = apiurl + 'year/' + year;
    console.log('Fetching data for year ', year);
    /* Remove any existing graphs */
    $('.svgholder').empty();
    // Fetch data for this year
    d3.json(yearurl, function(json) { 
        // Save to global for redrawing
        currentsource = json;
        draw(json, xformat);
    }); 
});
Path.map("/day/:day").to(function(){
    var day = this.params['day'];
    // save to global for redraw purpose
    xformat = d3.time.format("%H:%M")
    var url = apiurl + 'day/' + day;
    /* Remove any existing graphs */
    $('.svgholder').empty();
    // Fetch data for this year
    d3.json(url, function(json) { 
        // Save to global for redrawing
        currentsource = json;
        draw(json, xformat);
    }); 
});
Path.map("/").to(function(){
    var width = $('#main').css('width').split('px')[0];
    // save to global for redraw purpose
    xformat = d3.time.format("%A %H")
    if(width < 1200) {
        xformat = d3.time.format("%d %H");
    }
    /* Remove any existing graphs */
    $('.svgholder').empty();
    d3.json(apiurl, function(json) { 
        // Save to global for redrawing
        currentsource = json;
        draw(json, xformat);
    }); 
    // Fetch current weather
    d3.json(apiurl + 'now', function(json) { 
        current_weather = { 
            current: json[0]
        };
        rivets.bind(document.getElementById('current_weather'), current_weather);
    });
});

// Start listening for URL events
Path.history.listen(true);  // Yes, please fall back to hashtags if HTML5 is not supported.

// Initial fetch and draw
Path.history.pushState({}, "", window.location.pathname);

// Fetch current weather with 1 minute interval
setInterval(function() { d3.json(apiurl + 'now', function(json) { 
    // Update each key with new val
    for(key in current_weather.current) {
        current_weather.current[key] = json[0][key]
    }
}) }, 60*1000);

// Draw sparkline
d3.json(apiurl+'recent', function(json) {
    var tdata = []; 
    var wdata = []; 
    var pdata = [];
    json.forEach(function(k, v) {
        // Ordered wrong way, so unshift
        tdata.unshift(k.temp);
        wdata.unshift(k.avg_speed);
        pdata.unshift(k.barometer);
    });
    tsl = new sparkline('#sparkline', tdata, 'temp', tdata.length, 38, 'basis', true, 60*1000, 1000);
    wsl = new sparkline('#windsparkline', wdata, 'avg_speed', wdata.length, 38, 'basis', true, 60*1000, 1000);
    psl = new sparkline('#pressuresparkline', pdata, 'barometer', pdata.length, 38, 'basis', true, 60*1000, 1000);
    // Update each minute
    setInterval(wsl.update, 60*1000);
    setInterval(tsl.update, 60*1000);
    setInterval(psl.update, 60*1000);
});

// Init the data structure to be used by records and rivets
var record_weather = {current:{}};

// Fetch record weather
var updateRecordsYear = function(year) {
    var keys = ['max', 'min'];
    var vals = ['temp', 'avg_speed', 'daily_rain', 'barometer', 'gusts'];
    vals.forEach(function(k, v) {
        keys.forEach(function(func, idx) {
            // set key for rivets to set up proper setters and getters
            record_weather.current[func+k+'date'] = '';
            record_weather.current[func+k+'value'] = '';
            /// XXX needs a black list for certain types that doesn't make sense
            // like min daily_rain or min avg_speed
            d3.json(apiurl + 'record/'+k+'/'+func+'?start='+year, function(json) { 
                record_weather.current[func+k+'date'] = json[0].timestamp;
                record_weather.current[func+k+'value'] = json[0][k];
            });
        })
    });
}
// initial structure for rivets to work
updateRecordsYear('today');
//rivets.bind(document.getElementById('r2013'), record_weather);

// Populate all the tab content with the tab template
d3.selectAll('#record_weather .tab-pane').forEach(function (tab) {
   $(tab).html($('#record_table_template').html());
});
// Bind rivets after both elemend and var is available and populated
rivets.bind(document.getElementById('record_weather'), record_weather);

// Bind the tab clicks to fetching new content
$('#record_weather .nav-tabs a').bind('click', function(e) {
  e.preventDefault();

  // Find target container
  var tab = $($(this).attr('href'));

  // Get the year clicked
  var year = $(this).text();
  // Fetch new data from db
  updateRecordsYear(year);

  // Show tab
  $(this).tab('show');

});
