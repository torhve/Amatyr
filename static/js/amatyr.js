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

var graph = function(el, json, attr, linecolorfunc, yaxisleg, width, height) { 
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;


    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickFormat(d3.time.format("%H:%M"))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var colorscale2 = d3.scale.category20c();

    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.val); })
        .interpolate("basis")

    var svg = d3.select(el).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    json.forEach(function(d) {
        d.val = d[attr];
    });

    x.domain(d3.extent(json, function(d) { return d.date; }));
    y.domain(d3.extent(json, function(d) { return d.val; }));

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yaxisleg);

    var yrule = svg.selectAll("g.y")
        .data(y.ticks(10))
        .enter().append("g")
        .attr("class", "y axis")
      .append("svg:line")
        .attr("class", "yLine")
        .style("stroke", "#eee")
        .style("shape-rendering", "crispEdges")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y)
        .attr("y2", y);


    pathos = svg.append("path")
      .datum(json)
      .attr("class", "line")
      .attr("stroke", "darkred")
      .attr("d", line)

    pathos.each(function(d, i) {
        console.log(d, i);
    });


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



on_resize(function() {

    // Fetch new json data
    d3.json("/pg/", function(source) { 
        /* First remove any existing svg */
        $('#main svg').remove();

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

        graph('#temp', source, 'temp', colorscale, 'Temperature (°C)', width, height);
        graph('#pressure', source, 'barometer',colorscale,  'Air pressure (hPa)', width, height);
        graph('#wind', source, 'avg_speed', colorscale, 'Average wind speed (knot)', width, height);
        graph('#rain', source, 'daily_rain',colorscale,  'Daily rain (mm)', width, height);
        // Get the last element and populate rivets bindings with it
        rivets.bind(document.getElementById('main'), {current: source.slice(-1)[0]});
});
})(); // these parenthesis does the trick

// debulked onresize handler
function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};
//
