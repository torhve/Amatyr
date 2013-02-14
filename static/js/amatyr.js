var AmatYr = function(apiurl) {
    this.apiurl = apiurl;
    this.currentsource = false;
    this.current_weather;
    this.windroseData;
    this.that = this;
    that = this;
    // array of all sparklines, used for updating them dynamically
    var sparklines = [];

    /* Initial and on resize we draw draw draw */
    on_resize(function() {
        // Redraw graphs
        redraw();
        // Redraw sparklines
        for(key in sparklines) {
            sparklines[key].redrawWithAnimation();
        }
    }); // these parenthesis does the trick

    // debulked onresize handler
    function on_resize(c,t){onresize=function(){clearTimeout(t);t=setTimeout(c,100)};return c};

    // Fetch current weather
    d3.json(apiurl + 'now', function(json) { 
        current_weather = { 
            current: json[0]
        };
        rivets.bind(document.getElementById('current_weather'), current_weather);
    });

    /****
     *
     *
     * WIND ROSE SECTION
     *
     *
     */
    var drawWindrose = function(startarg) {
        if (this.windroseData == undefined) {
            // Get all the wind history and draw two wind roses
            d3.json('/api/windhist?start='+startarg, function(data) {
                this.windroseData = data;
                // Empty nodes
                // d3.selectAll('.windroserow div').html('');

                windrose.drawBigWindrose(data, "#windrose", "Frequency by Direction");
                windrose.drawBigWindrose(data, "#windroseavg", "Average Speed by Direction");
            });
        }else{ // update existing with new data
            d3.json('/api/windhist?start='+startarg, function(data) {
                this.windroseData = data;
                windrose.updateWindVisDiagrams(data);
            })
        }
    }
    // Create windroses
    windrose = new WindRose();


    var initPath = function() {
        // Register HTML5 push state handler for navbar links
        $("#main_nav a").bind("click", function(event){
            event.preventDefault();
            // Fix active link
            $('.navbar li.active').removeClass('active');
            $(this).closest('li').addClass('active');

            // Call path state to handle the clicked link
            Path.history.pushState({}, "", $(this).attr("href"));
        });

        Path.map("/year/:year").to(function(){
            var year = this.params['year'];
            var yearurl = apiurl + 'year/' + year;
            // Fetch data for this year
            d3.json(yearurl, function(json) { 
                // Save to global for redrawing
                that.currentsource = json;
                draw(json);
            }); 
            drawWindrose(year); 
        });
        Path.map("/day/:day").to(function(){
            var day = this.params['day'];
            var url = apiurl + 'day/' + day;
            // Fetch data for this year
            d3.json(url+'?start='+day, function(json) { 
                // Save to global for redrawing
                that.currentsource = json;
                draw(json);
            }); 
            drawWindrose(day); 
        });
        Path.map("/hour/:arg").to(function(){
            var arg = this.params['arg'];
            var url = apiurl + 'hour/' + arg;
            // Fetch data for this year
            d3.json(url+'?start='+arg, function(json) { 
                // Save to global for redrawing
                that.currentsource = json;
                draw(json);
            }); 
            drawWindrose(arg); 
        });
        Path.map("/").to(function(){
            var width = $('#main').css('width').split('px')[0];
            d3.json(apiurl+'hour?start=3day', function(json) { 
                // Save to global for redrawing
                that.currentsource = json;
                draw(json);
            });
            drawWindrose('3DAY'); 
        });

        // Start listening for URL events
        Path.history.listen(true);  // Yes, please fall back to hashtags if HTML5 is not supported.

        // Initial fetch and draw
        Path.history.pushState({}, "", window.location.pathname);
        // Fix initial active link in case user got direct link and not started at /
        $('#main_nav a[href="'+window.location.pathname+'"]').closest('li').addClass('active');
    }
    initPath();

    // Fetch current weather with 1 minute interval
    setInterval(function() { d3.json(apiurl + 'now', function(json) { 
        // Update each key with new val
        for(key in current_weather.current) {
            current_weather.current[key] = json[0][key]
        }
    }) }, 60*1000);

    // Draw sparkline
    d3.json(apiurl+'recent', function(json) {
        var tdata = []; 
        var wdata = []; 
        var pdata = [];
        json.forEach(function(k, v) {
            // Ordered wrong way, so unshift
            tdata.unshift(k.outtemp);
            wdata.unshift(k.windspeed);
            pdata.unshift(k.barometer);
        });
        sparklines.push(new sparkline('#sparkline', tdata, 'outtemp', tdata.length, 38, 'basis', true, 1000));
        sparklines.push(new sparkline('#windsparkline', wdata, 'windspeed', wdata.length, 38, 'basis', true, 1000));
        sparklines.push(new sparkline('#pressuresparkline', pdata, 'barometer', pdata.length, 38, 'basis', true, 1000));
        for(key in sparklines) {
            // Update each minute
            setInterval(sparklines[key].update, 60*1000);
        }
    });

    /**** 
     *
     *
     * RECORD WEATHER SECTION 
     *
     *
     * */

    // Init the data structure to be used by records and rivets
    var record_weather = {current:{}};

    // Fetch record weather
    var updateRecordsYear = function(year) {
        var keys = ['max', 'min'];
        var vals = ['outtemp', 'windspeed', 'rain', 'barometer', 'windgust'];
        vals.forEach(function(k, v) {
            keys.forEach(function(func, idx) {
                // set key for rivets to set up proper setters and getters
                record_weather.current[func+k+'date'] = '';
                record_weather.current[func+k+'value'] = '';
                /// XXX needs a black list for certain types that doesn't make sense
                // like min daily_rain or min windspeed
                d3.json(apiurl + 'record/'+k+'/'+func+'?start='+year, function(json) { 
                    if(json) {
                        record_weather.current[func+k+'date'] = json[0].datetime;
                        record_weather.current[func+k+'value'] = json[0][k];
                    }
                });
            })
        });
    }
    // initial structure for rivets to work
    updateRecordsYear('today');
    //rivets.bind(document.getElementById('r2013'), record_weather);

    // Populate all the tab content with the tab template
    d3.selectAll('#record_weather .tab-pane').forEach(function (tab) {
       $(tab).html($('#record_table_template').html());
    });
    // Bind rivets after both elemend and var is available and populated
    rivets.bind(document.getElementById('record_weather'), record_weather);

    // Bind the tab clicks to fetching new content
    $('#record_weather .nav-tabs a').bind('click', function(e) {
        e.preventDefault();

        // Find target container
        var tab = $($(this).attr('href'));

        // Get the year clicked
        var year = $(this).text();
        // Fetch new data from db
        updateRecordsYear(year);

        // Show tab
        $(this).tab('show');

    });
    return this;
}
var amatyrlib = new amatyrlib();
var amatyr = new AmatYr('/api/');
