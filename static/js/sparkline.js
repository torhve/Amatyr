var sparkline = function(id, data, key, width, height, interpolation, animate, transitionDelay) {
    var that = this;
    this.data = data;
    this.key = key;
    // create an SVG element inside the #graph div that fills 100% of the div
    this.graph = d3.select(id).append("svg:svg").attr("width", "100%").attr("height", "100%");

    // X scale will fit values from 0-10 within pixels 0-100
    var x = d3.scale.linear().domain([0, data.length]).range([0, width]); 
    var y = d3.scale.linear().domain(d3.extent(data)).range([height, 0]);
    this.x = x;
    this.y = y;
    this.transitionDelay = transitionDelay;
    this.animate = animate;
    this.interpolation = interpolation;

    this.line = d3.svg.line()
        .x(function(d,i) { return x(i); })
        .y(function(d) { return y(d); })
        .interpolate(interpolation)

        this.graph.append("svg:path").attr("d", this.line(data));
    this.redrawWithAnimation = function() {
        // Update domain
        var x = d3.scale.linear().domain([0, this.data.length]).range([0, width]); 
        var y = d3.scale.linear().domain(d3.extent(this.data)).range([height, 0]);
        // New linefunc
        line = d3.svg.line()
            .x(function(d,i) { return x(i); })
            .y(function(d) { return y(d); })
            .interpolate(interpolation)
        // update with animation
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

    this.redrawWithoutAnimation = function() {
        // static update without animation
        this.graph.selectAll("path")
            .data([this.data]) // set the new data
            .attr("d", this.line) // apply the new data values
    }
    this.update = function() {
        d3.json(amatyr.apiurl+'now', function(json) {
            data.shift(); // remove the first element of the array
            data.push(json[0][key]); // add a new element to the array 
            if(animate) {
                that.redrawWithAnimation();
            } else {
                that.redrawWithoutAnimation();
            }
        })
    }
    return this;
}
