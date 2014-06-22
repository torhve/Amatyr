/*
 * Implement a time line graph as a closure with getter-setter methods.
 * Ref http://bost.ocks.org/mike/chart/
 */
function timeSeriesChart() {
  var margin = {top: 20, right: 20, bottom: 20, left: 30},
      width = 760,
      height = 120,
      xValue = function(d) { return d[0]; },
      yValue = function(d) { return d[1]; },
      xScale = d3.time.scale(),
      yScale = d3.scale.linear(),
      yTicks = 6, // Todo make responsive
      interpolate = 'basis',
      xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickSize(6, 0),
      yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(yTicks), 
      line = d3.svg.line().x(X).y(Y).interpolate(interpolate);
      //area = d3.svg.area().x(X).y1(Y),

  function chart(selection) {
    selection.each(function(data) {

      // Convert data to standard representation greedily;
      // this is needed for nondeterministic accessors.
      data = data.map(function(d, i) {
        return [xValue.call(data, d, i), yValue.call(data, d, i)];
      });

      // Update the x-scale.
      xScale
          .domain(d3.extent(data, function(d) { return d[0]; }))
          .range([0, width - margin.left - margin.right]);

      // Update the y-scale.
      yScale
          .domain(d3.extent(data, function(d) { return d[1]; }))
          .range([height - margin.top - margin.bottom, 0]);

      // Select the svg element, if it exists.
      var svg = d3.select(this).selectAll("svg").data([data]);

      // Otherwise, create the skeletal chart.
      var gEnter = svg.enter().append("svg").append("g");

      // Update the inner dimensions.
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Add gradient
      amatyrlib.addGradient(g, width-margin.left-margin.right, height-margin.top-margin.bottom);

      //gEnter.append("path").attr("class", "area");
      gEnter.append("g").attr("class", "x axis");

      // Update the outer dimensions.
      svg .attr("width", width)
          .attr("height", height);


      // Update the inner dimensions.
      var g = svg.select("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // Update the y-axis
      g.append("g")
          .attr("class", "y axis")
          .call(yAxis)


      // Update the area path.
      //g.select(".area")
      //    .attr("d", area.y0(yScale.range()[0]));


      // Update y Grid lines
      g.selectAll("g.y")
         .data(yScale.ticks(yTicks))
           .enter().append("g") 
           .attr("class", "y axis")
         .append("svg:line")
           .attr("class", "yLine")
           .attr("x1", 0)
           .attr("x2", width-margin.right-margin.left)
           .attr("y1", yScale)
           .attr("y2", yScale);

      // Draw x grid lines
      g.selectAll("g.x")
          .data(xScale.ticks(10))
            .enter().append("g")
            .attr("class", "x axis")
          .append("svg:line")
            .attr("class", "yLine")
            .attr("x1", xScale)
            .attr("x2", xScale)
            .attr("y1", 0)
            .attr("y2", height)
            .style('stroke', function(d, i) { 
                if(d.getHours() == 0) {
                    return '#ccc';
                }
                return '#ededed';
            })
            .attr("stroke-opacity", function(d, i) {
                if(d.getHours() == 0) {
                    return '1';
                }
                return '0';
            })
            .style("shape-rendering", "crispEdges")
            ;

      // Update the x-axis.
      g.select(".x.axis")
          .attr("transform", "translate(0," + yScale.range()[0] + ")")
          .call(xAxis);

      // Insert Line last to get on top
      gEnter.append("path").attr("class", "line");
      // Update the line path.
      g.select(".line")
          .attr("d", line);

    });
  }

  // The x-accessor for the path generator; xScale âˆ˜ xValue.
  function X(d) {
    return xScale(d[0]);
  }

  // The x-accessor for the path generator; yScale âˆ˜ yValue.
  function Y(d) {
    return yScale(d[1]);
  }

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return xValue;
    xValue = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return yValue;
    yValue = _;
    return chart;
  };

  return chart;
}
