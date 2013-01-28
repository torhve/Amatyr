var drawlines = function(el, json, attr, linecolorfunc, yaxisleg, width, height) { 
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
