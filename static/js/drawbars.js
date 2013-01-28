var drawbars = function (target, data, attr, keyfmt, valfmt, yaxislegend, width, height) {
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format("%A"))

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

    var svg = d3.select(target).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    data.forEach(function(d) {
        d.date = parseDate(d.timestamp);
        d.val = +d[attr];
    });
    console.log(data);

    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.val; })]);

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
      .text(yaxislegend);

    svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr('rx', 3)
      .attr('ry', 3)
      .attr("x", function(d) { return x(d.date); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.val); })
      .attr("height", function(d) { return height - y(d[attr]); });

}

