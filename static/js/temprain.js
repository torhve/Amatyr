/* D3 function for drawing temperatures and rain bars in same svg */
var temprain = function(el, json, attr, xformat, yaxisleg, width, height) { 
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    var svg = d3.select(el).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Add gradient to chart
    addGradient(svg, width, height);

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    // Figure out xformat to be used given the domain and chart width
    var xextent = d3.extent(json, function(d) { return d.date; })
    console.log("Xaxis extent diff", xextent[1] - xextent[0]);
    var xdiff = xextent[1] - xextent[0];
    if (xdiff >= 8640000000) { // a year
        //xAxis.ticks(d3.time.months, 1).tickFormat(d3.time.format('%b %Y'));
        xAxis.ticks(d3.time.hours, 24).tickFormat(d3.time.format('%d.%m'));
    }
    else if (xdiff >= 100800000) { // 3 days
        xAxis.ticks(d3.time.hours, 4).tickFormat(d3.time.format('%a %H'));
    }
    else {
        xAxis.ticks(d3.time.hours, 2).tickFormat(d3.time.format('%H'));
    }

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    x.domain(xextent);
    y.domain([d3.min(json, function(d) { return d.tempmin }), d3.max(json, function(d) { return d.tempmax; })]);


    // Y Axis grid
    var yrule = svg.selectAll("g.y")
        .data(y.ticks(10))
        .enter().append("g")
        .attr("class", "y axis")
      .append("svg:line")
        .attr("class", "yLine")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y)
        .attr("y2", y)
        .style('stroke', function(d, i) { 
            if(d == 0) {
                return 'steelblue';
            }
            return '#ededed';
        })
        .style("shape-rendering", "crispEdges")
        ;

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);


    // Y Axis legend
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      /*
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(yaxisleg);
      */

    // Temp line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.outtemp); })
        .interpolate("basis")

    var pathos = svg.append("path")
      .datum(json)
      .attr("class", "line")
      .attr("stroke", "red")
      .attr("d", line)
    // Low Temp line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.tempmin); })
        .interpolate("basis")
    var pathoslow = svg.append("path")
      .datum(json)
      .attr("class", "line")
      .attr("stroke-dasharray", "5,5")
      .attr("stroke", "steelblue")
      .attr("d", line)
    // High Temp line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.tempmax); })
        .interpolate("basis")
    var pathoslow = svg.append("path")
      .datum(json)
      .attr("class", "line")
      .attr("stroke-dasharray", "5,5")
      .attr("stroke", "darkred")
      .attr("d", line)

    /* Pressure section */

    x.domain(d3.extent(json, function(d) { return d.date; }));
    var y = d3.scale.linear()
        .range([height, 0]);
    //y.domain(d3.extent(json, function(d) { return d.barometer; }));
    // hard coded minmax
    y.domain([950, 1050]);
    // Pressure line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.barometer); })
        .interpolate("basis")

    // Pressure path
    var pathospressure = svg.append("path")
      .datum(json)
      .attr("class", "line")
      .attr("stroke", "darkgreen")
      .attr("stroke-opacity", "0.2")
      .attr("d", line)



    /* Rain bar section */

    var x = d3.time.scale()
        .range([0, 1]);

    var y = d3.scale.linear()
        .range([height, height/2]);

    x.domain(json.map(function(d) { return d.date; }));
    y.domain([0, d3.max(json, function(d) { return d.rain; })]);

    var barxpos = function(d) { 
      var nr = x(d.date);
      var bwidth = (width/json.length)*0.8
      var barmargin = (width/json.length)*0.2
      var barx = width-bwidth;
      return  nr*bwidth + nr*barmargin;
    }

    svg.selectAll(".bar")
      .data(json)
    .enter().append("rect")
      .attr("class", "bar")
      .attr('rx', 3)
      .attr('ry', 3)
      .attr("x", barxpos )
      .attr("width", (width/json.length)*0.8)
      .attr("y", function(d) { return height; })
      .attr("height", function(d) { return 0; })
      .on("mouseover", function(d,i){
          d3.select(this)
          .attr("stroke-width", "3px");

      var x; var y;
      if (d3.event.pageX != undefined && d3.event.pageY != undefined) {
          x = d3.event.pageX;
          y = d3.event.pageY;
      } else {
          x = d3.event.clientX + document.body.scrollLeft +
          document.documentElement.scrollLeft;
      y = d3.event.clientY + document.body.scrollTop +
          document.documentElement.scrollTop;
      }

      var bubble_code = "<div id='tt' style='top:"
          + y + "px; left:" + ( x + 10 ) + "px;'><b>Date: <span class=value>"
          + d.timestamp + "</span><br>  Rain: <span class=value>" + Number(d.rain).toFixed(1) + "</span> mm</b><br />"
          + "</div>";
      $("body").append(bubble_code);

      }).on("mouseout", function(d,i){
          d3.select(this)
          .attr("stroke-width", "1px");
      $("#tt").remove();
      })

      .transition().delay(function (d,i){ return 300;})
      .duration(150)
      .attr("y", function(d) { return y(d.rain); })
      .attr("height", function(d) { return height - y(d.rain); })

      ;

    var valfmt = function(d) { 
        var nr = d.rain;
        if (nr == 0) return '';
        if (nr < 1 )
            return Number(nr).toFixed(1);
        return parseInt(nr);
    }
    svg.selectAll("text.score")
        .data(json)
        .enter().append("text")
        .attr("x", barxpos)
        .attr("y", function(d){ return y(d.rain) + 10 } )
        .attr("dx", (width/json.length)*0.4)
        .attr("dy", (width/json.length)*0.4)
        .attr("text-anchor", "middle")
        .attr('class', 'score')
        .style('font-size', function(d) { 
            // Compute proper font size
            w = (width/json.length)*0.6;
            return w + 'px' })
        .text(valfmt)

  var focus = svg.append("g")
      .attr("class", "focus");

  focus.append("line")
      .attr("class", "x")
      .attr("y1", y(0) - 6)
      .attr("y2", y(0) + 6);

  focus.append("line")
      .attr("class", "y")
      .attr("x1", width - 6)
      .attr("x2", width + 6);

  focus.append("circle")
      .attr("r", 3.5);

  /*
  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mousemove", mousemove);

  function mousemove() {
    var d = json[Math.round((x.invert(d3.mouse(this)[0]) - json[0].date) / 60*60*24)];
    focus.select("circle").attr("transform", "translate(" + x(d[0]) + "," + y(d[1]) + ")");
    focus.select(".x").attr("transform", "translate(" + x(d[0]) + ",0)");
    focus.select(".y").attr("transform", "translate(0," + y(d[1]) + ")");
    svg.selectAll(".x.axis path").style("fill-opacity", Math.random()); // XXX Chrome redraw bug
  }*/
}

var addGradient = function(target, w, h) {
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
        .attr("stop-color", "#fff")
        .attr("stop-opacity", 1);

    gradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#f2f2f2")
        .attr("stop-opacity", 1);

    target.append("svg:rect")
        .attr("width", w)
        .attr("height", h)
        .style("fill", "url(#gradient)");
}
