/* D3 function for drawing temperatures and rain bars in same svg */
var temprain = function(el, data, width, height) { 
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom,
        interpolation = 'basis',
        bisectDate = d3.bisector(function(d) { return d.date; }).left; // Bisector used for mouse over

    var svg = d3.select(el).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Add gradient to chart
    var gradient = amatyrlib.addGradient(svg, width, height);
    // Add mouseover overlay

    var x = d3.time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    // Figure out xformat to be used given the domain and chart width
    var xextent = d3.extent(data, function(d) { return d.date; })
    xFormatter(xAxis, xextent);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    x.domain(xextent);
    y.domain([d3.min(data, function(d) { return d.tempmin }), d3.max(data, function(d) { return d.tempmax; })]);


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
        .interpolate(interpolation)

    var pathos = svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("stroke", "#b5152b")
      .attr("d", line)
    // Low Temp line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.tempmin); })
        .interpolate(interpolation)
    var pathoslow = svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("stroke-dasharray", "5,5")
      .attr("stroke", "#7b6bb9")
      .attr("d", line)
    // High Temp line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.tempmax); })
        .interpolate(interpolation)
    var pathoshigh = svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("stroke-dasharray", "5,5")
      .attr("stroke", "#8C52E2")
      .attr("d", line)

    /* Pressure section */

    x.domain(d3.extent(data, function(d) { return d.date; }));
    var y = d3.scale.linear()
        .range([height, 0]);
    //y.domain(d3.extent(data, function(d) { return d.barometer; }));
    // hard coded minmax
    y.domain([950, 1050]);
    // Pressure line
    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.barometer); })
        .interpolate(interpolation)

    // Pressure path
    var pathospressure = svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("stroke", "#5c8843")
      .attr("stroke-opacity", "0.5")
      .attr("d", line)


    /* Rain bar section */

    var timex = d3.time.scale()
        .range([0, 1]);

    var timey = d3.scale.linear()
        .range([height, height/2]);

    timex.domain(data.map(function(d) { return d.date; }));
    timey.domain([0, d3.max(data, function(d) { return d.rain; })]);

    var barxpos = function(d) { 
      var nr = timex(d.date);
      var bwidth = (width/data.length)*0.8
      var barmargin = (width/data.length)*0.2
      var barx = width-bwidth;
      return  nr*bwidth + nr*barmargin;
    }

    svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr('rx', 3)
      .attr('ry', 3)
      .attr("x", barxpos )
      .attr("width", (width/data.length)*0.8)
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
          + d.datetime + "</span><br>  Rain: <span class=value>" + Number(d.rain).toFixed(1) + "</span> mm</b><br />"
          + "</div>";
      $("body").append(bubble_code);

      }).on("mouseout", function(d,i){
          d3.select(this)
          .attr("stroke-width", "1px");
      $("#tt").remove();
      })

      .transition().delay(function (d,i){ return 300;})
      .duration(150)
      .attr("y", function(d) { return timey(d.rain); })
      .attr("height", function(d) { return height - timey(d.rain); })
      ;

    var valfmt = function(d) { 
        var nr = d.rain;
        if (nr == 0) return '';
        if (nr < 1 )
            return Number(nr).toFixed(1);
        return parseInt(nr);
    }
    /* Bar text */
    svg.selectAll("text.score")
        .data(data)
        .enter().append("text")
        .attr("x", barxpos)
        .attr("y", function(d){ return timey(d.rain) + 10 } )
        .attr("dx", (width/data.length)*0.4)
        .attr("dy", (width/data.length)*0.4)
        .attr("text-anchor", "middle")
        .attr('class', 'score')
        .style('font-size', function(d) { 
            // Compute proper font size
            w = (width/data.length)*0.6;
            return w + 'px' })
        .text(valfmt)

    // Append a mouseover rule
    var mRule = svg.append('svg:line')
    .attr("class", "ruler")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", 0)
    .attr("y2", height)

    // set up a overlay over the graph that we will use to listen to mouse events
    svg.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .on("mousemove", mousemove)
      .on('mouseout', function(d, i) {
          // move tooltip off screen
          d3.select('#tooltip')
            .attr('style', 'display:hidden;top:-1000pxleft:-1000px');
          // hide the ruler 
          mRule.style("stroke", "none");
      })

    // set up the timestamp rivets object
    ttobj = {d:{}};
    for(key in data[0]) { 
        ttobj.d[key] = data[0][key];
    }
    // bind timestamp object to tooltip using rivets
    rivets.bind(document.getElementById('tooltip'), ttobj);

    function mousemove() {
        var graphx = d3.mouse(this)[0];
        var x0 = x.invert(graphx);
        var i = bisectDate(data, x0, 1);
        var d = data[i];
        var tx; var ty;
        if (d3.event.pageX != undefined && d3.event.pageY != undefined) {
            tx = d3.event.pageX;
            ty = d3.event.pageY;
        } 
        // if the posititon is too close to the edge, move it left
        if ((window.innerWidth - tx) < 300) {
            // roughly the size of the tooltip
            tx -= 275;
        }

        // move the tooltip element
        d3.select('#tooltip')
            .attr('style', 'display: block; top:'+(ty+10)+'px;left:'+(tx+10)+'px');
        // update the rivets tt obj
        for(key in d) { 
            ttobj.d[key] = d[key];
        }

        // move the ruler
        mRule.attr('x1', graphx)
             .attr('x2', graphx)
             .style("stroke", "#222")
             .style("stroke-width", "1px")
            ;
    }
    /* Function to update the graph every minute if we are looking at the daily graph. This can be animated */
    this.updateToday = function(data) {
        // update with animation
        // function update(data)
        this.graph.selectAll("path")
            .data([this.data]) // set the new data
            .attr("transform", "translate(" + this.x(1) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
            .attr("d", line) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
            .transition() // start a transition to bring the new value into view
            .ease("linear")
            .duration(this.transitionDelay) // for this demo we want a continual slide so set this to the same as the setInterval amount below
            .attr("transform", "translate(" + this.x(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value

        /* thanks to 'barrym' for examples of transform: https://gist.github.com/1137131 */
    }
    /* Function to update the graph completeley */
    this.update = function(data) {
    }
    return this;
}

