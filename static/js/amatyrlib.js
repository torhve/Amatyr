/* dynamic xformat helper for timelines */
var xFormatter = function(xAxis, xextent) {
    var cWidth = document.body.clientWidth;
    //console.log("Xaxis extent diff, client width", xextent[1] - xextent[0], document.body.clientWidth);

    // Reduce numer of ticks if small amount of pixels available
    var widthFactor = 1;
    if(cWidth < 700) {
        widthFactor = 2;
    }else if(cWidth < 500) {
        widthFactor = 3;
    }


    var xdiff = xextent[1] - xextent[0];
    if (xdiff >= 3628800000) { // a monthish
        xAxis.ticks(d3.time.months, 1*widthFactor).tickFormat(d3.time.format('%d.%m'));
    }
    else if (xdiff >= 2674800000) { // a monthish
        //xAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format('%b %Y'));
        xAxis.ticks(d3.time.days, 9*widthFactor).tickFormat(d3.time.format('%d.%m'));
    }
    else if (xdiff >= 345600000) { // a weekish
        //xAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format('%b %Y'));
        xAxis.ticks(d3.time.hours, 24*widthFactor).tickFormat(d3.time.format('%d.%m'));
    }
    else if (xdiff >= 100800000) { // 3 days
        xAxis.ticks(d3.time.hours, 6*widthFactor).tickFormat(d3.time.format('%a %H'));
    }
    else {
        xAxis.ticks(d3.time.hours, 1*widthFactor).tickFormat(d3.time.format('%H'));
    }
}



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

var draw = function(source) {
    gsource = source;
    //console.log('Current dataset', source);
    /* First remove any existing svg */
    /* Remove any spinners */
    $('.svgholder').empty();


    // The date format of SQL
    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    // Add d3 js date for each datum
    source.forEach(function(d) {
        d.date = parseDate(d.datetime);
        // also fix wind speed to be in m/s
        d.windspeed = d.windspeed/3.6;
        d.windgust = d.windgust/3.6;
    });
    var width = $('#main').css('width').split('px')[0];
    var height = width/4;

    /* Line graphs */
    var tempgraph = temprain('#temp', source, width, height);
    // Less height for less important graphs
    var height = width/4;
    /*
    drawlines('#pressure', source, 'barometer','Air pressure (hPa)', width, height);
    drawlines('#wind', source, 'windspeed', 'Wind speed m/s', width, height);
    /* Disable rain graph as it is part of temp graph now
    drawlines('#rain', source, 'rain','Daily rain (mm)', width, height);
    drawlines('#winddir', source, 'winddir','Wind direction (°)', width, height);
    //drawlines('#humidity', source, 'outhumidity','Humidity (%)', width, height);

    */
    var vals = ['windspeed', 'windgust', 'outhumidity', 'winddir', 'rain', 'barometer', 'inhumidity', 'intemp', 'outtemp', 'dewpoint', 'heatindex', 'windchill'];
    d3.select('#graphtabs ul.nav-tabs').selectAll('li')
        .data(vals)
      .enter().append('li')
        .classed('active', function(d,i) {
            if (i == 0) {
                return true;
            }
            return false;
        }
        )
        .html(function(d, i) { 
            return '<a data-toggle="tab" href="#tab_graph_'+d+'">'+d.charAt(0).toUpperCase() + d.substr(1).toLowerCase()+'</a>'
        });
    d3.select('#graphtabs .tab-content').selectAll('div')
        .data(vals)
      .enter().append('div')
        .classed('tab-pane', true)
        .classed('active', function(d,i) {
            if (i == 0) {
                return true;
            }
            return false;
        }
        )
        .attr('id', function(d,i) { return 'tab_graph_'+d; })
        .html(function(d, i) { 
            return '<div class="svgholder '+d+'"></div>';
        });
    vals.forEach(function(k,v) {
        if(source[0][k] != undefined && source[0][k] != NaN && source[0][k] != null) {
            d3.select("#graphtabs .svgholder."+k)
            .datum(source)
            .call(timeSeriesChart()
                .width(width)
                .height(height)
                .x(function(d) { return d.date; })
                .y(function(d) { return +d[k]; }));
        }
    });


    /* Bar graphs */
    /*
    bartender('#rain', 'rain', 'Daily Rain', width, height);
    bartender('#temp', 'temp', 'Daily Max Temp', width, height);
    bartender('#wind', 'windspeed', 'Daily Max Wind', width, height);
    */

    // Get the last element and populate rivets bindings with it
    rivets.bind(document.getElementById('main'), {
        current: source.slice(-1)[0],
        first: source.slice(0)[0]
    });
}

/* Container for assorted helpers */
var amatyrlib = function() {
    this.that = this;
    that = this;
    this.addGradient = function(target, w, h) {
        /*
        var gradient = target.append("svg:defs")
          .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        gradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#fafafa")
            .attr("stop-opacity", 1);

        gradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#f0f0f0")
            .attr("stop-opacity", 1);
*/

        target.append("svg:rect")
            .attr("width", w)
            .attr("height", h)
            .style("fill", "url(#myLinearGradient1)");
    }
    /* Pad helper */
    Number.prototype.pad = function (len) {
        if(this.toString().length < len) {
            return (new Array(len+1).join("0") + this).slice(-len);
        }
        return this;
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
            return Number(value/3.6).toFixed(1) + ' m/s';
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
        return 'display:inline-block;-o-transform: rotate('+value+'deg);-ms-transform: rotate('+value+'deg);-moz-transform: rotate('+value+'deg);-webkit-transform: rotate('+value+'deg);transform: rotate('+value+'deg);'
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

    /* Formatter helper */
    this.autoformat = function(name, value) {
        if (name == undefined || value == undefined) return value;
        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
        if (name == 'datetime') {
            var date = parseDate(value);
            return d3.time.format('%b')(date) + ' ' + date.getDate().pad(2);
        }
        if (name == 'dayrain') {
            var val = Number((Number(value)).toFixed(0)).pad(1) + ' mm';
            if (val == "0 mm") {
                return '<span class="muted">0 mm</span>';
            }
            return val;
        }
        if (name == 'outtemp') {
            var val = Number((value).toFixed(1));
            var color;
            if (val < 0) {
                color = 'steelblue';
            }else {
                color = 'red';
            }
            return '<span style="color:'+color+'">'+val+ ' </span>°C';
        }
        if (name == 'windspeed')
            return rivets.formatters.wind(value);
        if (name == 'barometer')
            return rivets.formatters.pressure(value);
        if (name == 'winddir') {
            var degree = Number((value).toFixed(0))
            return '<i title="'+degree+' °" class="icon-arrow-up" style="'+rivets.formatters.rotate(degree)+'"></i>';
        }

        return value;
    }

    /* Create a custom rivets binder that looks into data changed and transitions the update in data with colorful updating depending on if the value decreased or increase.

     It expects data in the following form
       float unit
       eg. -2.9 hPa
     and will only look at the value 
    */
    rivets.binders.texttransition = function(el, value) {
        var newVal, oldVal, transitonTime = 5*1000, color;
        if (value != null) {
            newVal = parseFloat(value.split(' ')[0]);
            if (el.textContent != null) {
                var val = parseFloat(el.textContent.split(' ')[0]);
                if (val != NaN) {
                    oldVal = val;
                }
            }
        }
        if(oldVal > newVal) {
            // Value decrease, we show this as red
            color = '#b5152b';
        }else if (oldVal < newVal) {
            // Value increase, we show this as green
            color = '#5c8843';
        }
        // Animate if color
        if (color) {
            // There
            d3.select(el.parentNode).transition()
                .style('background-color', color)
                .duration(transitonTime);
            d3.select(el)
                .classed('trans', true)
            // And back again
            d3.select(el.parentNode).transition()
                .style('background-color', 'inherit')
                .duration(transitonTime)
                .delay(transitonTime);
            // remove trans class for font styling
            setTimeout(function() {
                d3.select(el)
                .classed('trans', false)
            }, transitonTime);
        }
        if (el.innerText != null) {
            return el.innerText = value != null ? value : '';
        } else {
            return el.textContent = value != null ? value : '';
        }
    }
    return this;
}
