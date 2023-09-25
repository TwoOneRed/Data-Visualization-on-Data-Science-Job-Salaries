// Set up the SVG canvas
var svgWidth = 900;
var svgHeight = 450;

var svg = d3.select("#mapchart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

var projection = d3.geoNaturalEarth1()
    .scale(180)
    .translate([svgWidth / 2, svgHeight / 2]);

var path = d3.geoPath()
    .projection(projection);

// Load the GeoJSON data for the world map
d3.json("world_map.json").then(function(worldMap) {
    if (!worldMap || !worldMap.objects || !worldMap.objects.world || !worldMap.objects.world.geometries) {
    console.error("Error loading GeoJSON data");
    return;
    }

    var features = topojson.feature(worldMap, worldMap.objects.world).features;

    // Load the dataset
    d3.csv("ds_salaries.csv").then(function(data) {

        // Load ISO3166 country codes
        d3.json("ISO3166_Country_Code.json").then(function(isoCodes) {
            var ISO3166 = isoCodes;
            

            // Function to update the map based on the selected year
            function updateMap(year) {
                d3.select("#legend").selectAll("*").remove();
                svg.selectAll("g").remove();
                svg.selectAll("path").remove();

                // Group and aggregate the data for the selected year
                var filteredData = data.filter(function(d) {
                    return d.work_year == year;
                });

                var result = d3.group(filteredData, d => d.company_location);
                var aggregatedData = [];

                result.forEach(function(values, key) {
                    var salaries = values.map(d => +d.salary_in_usd);
                    var averageSalary = d3.mean(salaries).toFixed(2);
                    var medianSalary = d3.median(salaries).toFixed(2);
                    var countryName = ISO3166[key];

                    if (countryName) {
                    aggregatedData.push({
                        country: countryName,
                        averageSalary: averageSalary,
                        medianSalary: medianSalary
                    });
                    }
                });
                
                var minAverageSalary = d3.min(aggregatedData, function(d) {
                    return +d.averageSalary;
                });
                var maxAverageSalary = d3.max(aggregatedData, function(d) {
                    return +d.averageSalary;
                });

                // Color scale for the map
                var colorScale = d3.scaleSequential()
                    .interpolator(d3.interpolateYlGnBu)
                    .domain([minAverageSalary, maxAverageSalary])
                    .unknown("#AAAAAA");

                // Match country names in GeoJSON with aggregated data
                features.forEach(function(feature) {
                    var countryName = feature.properties.name;

                    var match = aggregatedData.find(function(d) {
                    return d.country === countryName;
                    });

                    if (match) {
                    feature.properties.averageSalary = match.averageSalary;
                    feature.properties.medianSalary = match.medianSalary;
                    } else {
                    delete feature.properties.averageSalary;
                    delete feature.properties.medianSalary;
                    }
                });

                // Create a group element for the map paths and apply zoom behavior
                var g = svg.append("g");

                // Update the map paths
                var paths = g.selectAll("path")
                    .data(features)
                    .join("path")
                    .attr("d", path)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1)
                    .attr("class", function(d) {
                    return d.properties.averageSalary ? "hoverable" : "";
                    })
                    .attr("fill", function(d) {
                    return d.properties.averageSalary
                        ? colorScale(d.properties.averageSalary)
                        : "#AAAAAA";
                    })
                    .on("mouseover", function(d) {
                    if (d.properties.averageSalary) {
                        d3.select(this).attr("fill", "orange");
                    }
                    })
                    .on("mouseout", function(d) {
                    if (d.properties.averageSalary) {
                        d3.select(this).attr("fill", function(d) {
                        return colorScale(d.properties.averageSalary);
                        });
                    }
                    });

                paths.append("title");

                paths
                    .transition()
                    .duration(1000)
                    .attrTween("fill", function(d) {
                    var interpolate = d3.interpolate("#AAAAAA", colorScale(d.properties.averageSalary));
                    return function(t) {
                        return interpolate(t);
                    };
                    });

                paths.select("title")
                    .text(function(d) {
                    if (d.properties.averageSalary) {
                        return (
                        "Country: " + d.properties.name +
                        "\nAverage Salary: $" + d.properties.averageSalary +
                        "\nMedian Salary: $" + d.properties.medianSalary
                        );
                    } else {
                        return "";
                    }
                    });

                // Create the color scale legend
                var legendData = colorScale.ticks(5).map(function(d) {
                    return {
                    color: colorScale(d),
                    label: formatValue(d)
                    };
                });

                // Define a function to format the scale values
                function formatValue(value) {
                    if (value >= 1000) {
                    return (value / 1000) + "k";
                    } else {
                    return value.toFixed(2);
                    }
                }

                var legendContainer = d3.select("#legend")
                    .append("div")
                    .attr("class", "legend");

                var legendScale = legendContainer.append("div")
                    .attr("class", "legend-scale");

                legendScale.selectAll(".legend-label")
                    .data(legendData)
                    .enter()
                    .append("span")
                    .attr("class", "legend-label")
                    .text(function(d) {
                    return d.label;
                    });

                var legendColor = legendContainer.append("div")
                    .attr("class", "legend-color");

                legendColor.selectAll(".legend-color-box")
                    .data(legendData)
                    .enter()
                    .append("div")
                    .attr("class", "legend-color-box")
                    .style("background-color", function(d) {
                    return d.color;
                    });


                // Create the zoom behavior and apply it to the SVG element
                var zoom = d3.zoom()
                    .scaleExtent([1, 8])
                    .on("zoom", function(event) {
                    g.attr("transform", event.transform);
                    });

                svg.call(zoom);
            }
            
            // Initial map update
            var initialYear = document.getElementById("myRange").value;
            updateMap(initialYear);

            // Event listener for year selection change
            document.getElementById("myRange").addEventListener("change", function(event) {
                var selectedYear = event.target.value;
                updateMap(selectedYear);
            });

            let isPlaying = false;
            let intervalId;

            const playButton = document.getElementById('playButton');
            const stopButton = document.getElementById('stopButton');

            playButton.addEventListener('click', startSlider);
            stopButton.addEventListener('click', stopSlider);

            function startSlider() {
                if (!isPlaying) {
                    intervalId = setInterval(moveSlider, 2000);
                    isPlaying = true;
                }
            }

            // Function to stop the autoplay
            function stopSlider() {
                clearInterval(intervalId);
                isPlaying = false;
            }

            // Function to automatically move the slider to the next value
            function moveSlider() {
                updateMap(parseInt(document.getElementById('myRange').value));
            }
            
        });
    });
});


