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
        return Number(value*0.51444).toFixed(1) + ' m/s';
    return '0 m/s'
}
rivets.formatters.degree = function(value) {
    if (value)
        return Number((value).toFixed(1)) + ' °';
    return '0 °';
}
rivets.formatters.percent = function(value) {
    if (value)
        return Number((value).toFixed(0)) + ' %';
    return '0%'
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
        else if (key == 'rain') {
            valfmt = function(d) { 
                return rivets.formatters.rain(d.val)
            }
        }
        else if (key == 'windspeed') {
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
        d.date = parseDate(d.datetime);
    });
    var width = $('#main').css('width').split('px')[0];
    var height = width/4;

    /* Line graphs */
    temprain('#temp', source, 'outtemp', xformat, 'Temperature (°C)', width, height);
    drawlines('#pressure', source, 'barometer',xformat,  'Air pressure (hPa)', width, height);
    drawlines('#wind', source, 'windspeed', xformat, 'Average wind speed (knot)', width, height);
    /* Disable rain graph as it is part of temp graph now
    drawlines('#rain', source, 'rain',xformat,  'Daily rain (mm)', width, height);
    */
    drawlines('#winddir', source, 'winddir',xformat,  'Daily wind direction (°)', width, height);
    drawlines('#humidity', source, 'outhumidity',xformat,  'Humidity (%)', width, height);
    /* Bar graphs */
    /*
    bartender('#rain', 'rain', 'Daily Rain', width, height);
    bartender('#temp', 'temp', 'Daily Max Temp', width, height);
    bartender('#wind', 'windspeed', 'Daily Max Wind', width, height);
    */
}

var redraw = function() {
    draw(currentsource, xformat);
}
