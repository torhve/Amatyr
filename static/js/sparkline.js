function sparkline(id, data, width, height, interpolation, animate, updateDelay, transitionDelay) {
    // create an SVG element inside the #graph div that fills 100% of the div
    var graph = d3.select(id).append("svg:svg").attr("width", "100%").attr("height", "100%");

    // X scale will fit values from 0-10 within pixels 0-100
    var x = d3.scale.linear().domain([0, data.length]).range([width, 0]); 
    var y = d3.scale.linear().domain(d3.extent(data)).range([0, height]);

    // create a line object that represents the SVN line we're creating
    var line = d3.svg.line()
        // assign the X function to plot our line as we wish
        .x(function(d,i) { 
            // verbose logging to show what's actually being done
            //console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
            // return the X coordinate where we want to plot this datapoint
            return x(i); 
        })
    .y(function(d) { 
        // verbose logging to show what's actually being done
        //console.log('Plotting Y value for data point: ' + d + ' to be at: ' + y(d) + " using our yScale.");
        // return the Y coordinate where we want to plot this datapoint
        return y(d); 
    })
    .interpolate(interpolation)

        // display the line by appending an svg:path element with the data line we created above
        graph.append("svg:path").attr("d", line(data));
    // or it can be done like this
    //graph.selectAll("path").data([data]).enter().append("svg:path").attr("d", line);

    function redrawWithAnimation() {
        // update with animation
        graph.selectAll("path")
            .data([data]) // set the new data
            .attr("transform", "translate(" + x(1) + ")") // set the transform to the right by x(1) pixels (6 for the scale we've set) to hide the new value
            .attr("d", line) // apply the new data values ... but the new value is hidden at this point off the right of the canvas
            .transition() // start a transition to bring the new value into view
            .ease("linear")
            .duration(transitionDelay) // for this demo we want a continual slide so set this to the same as the setInterval amount below
            .attr("transform", "translate(" + x(0) + ")"); // animate a slide to the left back to x(0) pixels to reveal the new value

        /* thanks to 'barrym' for examples of transform: https://gist.github.com/1137131 */
    }

    function redrawWithoutAnimation() {
        // static update without animation
        graph.selectAll("path")
            .data([data]) // set the new data
            .attr("d", line) // apply the new data values
    }

    setInterval(function() {
        d3.json(apiurl+'now', function(json) {
            console.log('databefore', data);

            data.shift(); // remove the first element of the array
            data.push(json[0].temp); // add a new element to the array 
            console.log('dataafter', data);
            if(animate) {
                redrawWithAnimation();
            } else {
                redrawWithoutAnimation();
            }
        })
    }, updateDelay);
}
