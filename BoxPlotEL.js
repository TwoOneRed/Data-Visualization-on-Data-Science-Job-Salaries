var bpelchartWidth = 550;
var bpelchartHeight = 300;
var bpelmargin = { top: 40, right:20, bottom: 0, left: 70};

var boxplot3 = d3.select("#BoxPlotEL")
    .style("width", bpelchartWidth + "px")
    .style("height", bpelchartHeight + "px");

var bpel = boxplot3.append("svg")
    .attr("width", bpelchartWidth)
    .attr("height", bpelchartHeight)
    .append("g")
    .attr("transform", "translate(" + bpelmargin.left + "," + bpelmargin.top + ")");

d3.csv("ds_salaries.csv").then(function(dataset) {
    // Convert salary_in_usd and work_year values to numbers
    dataset.forEach(function(d) {
        d.salary_in_usd = +d.salary_in_usd;
        d.work_year = +d.work_year;
    });

    // Filter out negative values
    dataset = dataset.filter(function(d) {
        return d.salary_in_usd >= 0;
    });

    // Dimensions
    const margin = { top: 40, right: 20, bottom: 50, left: 40 };
    const width = 550 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create box plot data
    function createBoxPlotData(workYear) {
        const filteredData = dataset.filter(function(d) {
        return d.work_year === workYear;
        });

        const quartiles = filteredData.reduce(function(acc, d) {
        const key = d.experience_level;

        const experienceLevelLabels = {
        EN: "Entry-Level",
        MI: "Intermediate",
        SE: "Senior",
        EX: "Executive"
        };

        const labeledExperienceLevel = experienceLevelLabels[key];
        if (!acc[labeledExperienceLevel]) {
        acc[labeledExperienceLevel] = [];
        }
        acc[labeledExperienceLevel].push(d.salary_in_usd);
        return acc;
    }, {});

        return Object.entries(quartiles).map(function([key, values]) {
        const q1 = d3.quantile(values.sort(d3.ascending), 0.25);
        const median = d3.quantile(values.sort(d3.ascending), 0.5);
        const q3 = d3.quantile(values.sort(d3.ascending), 0.75);
        const iqr = q3 - q1;
        const upperWhisker = Math.min(q3 + 1.5 * iqr, d3.max(values));
        const lowerWhisker = Math.max(q1 - 1.5 * iqr, d3.min(values));
        const outliers = values.filter(function(v) {
            return v < lowerWhisker || v > upperWhisker;
        });
        return {
            experienceLevel: key,
            values,
            q1,
            median,
            q3,
            lowerWhisker,
            upperWhisker,
            outliers
        };
        });
    }

    // Create box plots
    function createBoxPlots(workYear) {
        const boxplotData = createBoxPlotData(workYear);

        // Remove old elements
        bpel.selectAll(".box, .whisker, .median-line, .dot, .min-line, .max-line, .axis-label").remove();
        bpel.select(".x-axis").remove();
        bpel.select(".y-axis").remove();
        bpel.select(".chart-title").remove();

        // Scales
        const xScale = d3.scaleBand()
        .domain(["Entry-Level", "Intermediate", "Senior", "Executive"])
        .range([0, width])
        .padding(0.1);

        const yMax = d3.max(boxplotData, function(d) {
        return d.upperWhisker;
        });
        const yMin = d3.min(boxplotData, function(d) {
        return d.lowerWhisker;
        });
        const yScale = d3.scaleLinear()
        .domain([-45000, 500000]) // Adjust the domain to include space for min and max lines
        .range([height, 0]);

        // Create box plots
        bpel.selectAll(".box")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("rect")
            .attr("class", "box")
            .attr("x", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 0.25;
            })
            .attr("y", function(d) {
                return yScale(d.q3);
            })
            .attr("width", xScale.bandwidth() * 0.5)
            .attr("height", function(d) {
                return yScale(d.q1) - yScale(d.q3);
            })
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("x", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 0.25;
                })
                .attr("y", function(d) {
                return yScale(d.q3);
                })
                .attr("width", xScale.bandwidth() * 0.5)
                .attr("height", function(d) {
                return yScale(d.q1) - yScale(d.q3);
                })),
            (exit) => exit
            .attr("opacity", 1)
            .call((exit) => exit.transition().duration(500).attr("opacity", 0).remove())
        );
        

        // Show whiskers
        bpel.selectAll(".whisker")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("line")
            .attr("class", "whisker")
            .attr("x1", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 0.5;
            })
            .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 0.5;
            })
            .attr("y1", function(d) {
                return yScale(d.lowerWhisker);
            })
            .attr("y2", function(d) {
                return yScale(d.upperWhisker);
            })
            .attr("stroke", "black")
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("x1", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 0.5;
                })
                .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 0.5;
                })
                .attr("y1", function(d) {
                return yScale(d.lowerWhisker);
                })
                .attr("y2", function(d) {
                return yScale(d.upperWhisker);
                })),
            (exit) => exit
            .attr("opacity", 1)
            .call((exit) => exit.transition().duration(500).attr("opacity", 0).remove())
        );

        // Show median line
        bpel.selectAll(".median-line")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("line")
            .attr("class", "median-line")
            .attr("x1", function(d) {
                return xScale(d.experienceLevel);
            })
            .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth();
            })
            .attr("y1", function(d) {
                return yScale(d.median);
            })
            .attr("y2", function(d) {
                return yScale(d.median);
            })
            .attr("stroke", "black")
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),

            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("x1", function(d) {
                return xScale(d.experienceLevel);
                })
                .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth();
                })
                .attr("y1", function(d) {
                return yScale(d.median);
                })
                .attr("y2", function(d) {
                return yScale(d.median);
                })),
            (exit) => exit
            .attr("opacity", 1)
            .call((exit) => exit.transition().duration(500).attr("opacity", 0).remove())
        );

        // Create dots for outliers
        bpel.selectAll(".dot")
        .data(boxplotData, function(d) {
            return d.experienceLevel;
        })
        .join(
            (enter) => enter
            .append("g")
            .attr("class", "dot")
            .selectAll("circle")
            .data(function(d) {
                return d.outliers.map(function(outlier) {
                return {
                    experienceLevel: d.experienceLevel,
                    outlier
                };
                });
            })
            .join("circle")
            .attr("cx", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 2;
            })
            .attr("cy", function(d) {
                return yScale(d.outlier);
            })
            .attr("r", 3)
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("cx", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 2;
                })
                .attr("cy", function(d) {
                return yScale(d.outlier);
                })),
            (exit) => exit
            .call((exit) => exit.transition().duration(500).attr("opacity", 0))
            .remove()
            );
        
        // Create min lines (horizontal lines for lower whisker)
        bpel.selectAll(".min-line")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("line")
            .attr("class", "min-line")
            .attr("x1", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 4; // Adjust the x position to align with the whisker
            })
            .attr("y1", function(d) {
                return yScale(d.lowerWhisker);
            })
            .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 3 / 4; // Adjust the x position to align with the whisker
            })
            .attr("y2", function(d) {
                return yScale(d.lowerWhisker);
            })
            .attr("stroke", "red")
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("x1", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 4; // Adjust the x position to align with the whisker
                })
                .attr("y1", function(d) {
                return yScale(d.lowerWhisker);
                })
                .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 3 / 4; // Adjust the x position to align with the whisker
                })
                .attr("y2", function(d) {
                return yScale(d.lowerWhisker);
                })),
            (exit) => exit
            .call((exit) => exit.transition().duration(500).attr("opacity", 0))
            .remove()
        );

        // Create max lines (horizontal lines for upper whisker)
        bpel.selectAll(".max-line")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("line")
            .attr("class", "max-line")
            .attr("x1", function(d) {
            return xScale(d.experienceLevel) + xScale.bandwidth() / 4; // Adjust the x position to align with the whisker
            })
            .attr("y1", function(d) {
            return yScale(d.upperWhisker);
            })
            .attr("x2", function(d) {
            return xScale(d.experienceLevel) + xScale.bandwidth() * 3 / 4; // Adjust the x position to align with the whisker
            })
            .attr("y2", function(d) {
            return yScale(d.upperWhisker);
            })
            .attr("stroke", "red")
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
        (update) => update
            .call((update) => update.transition().duration(500)
            .attr("x1", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 4; // Adjust the x position to align with the whisker
            })
            .attr("y1", function(d) {
                return yScale(d.upperWhisker);
            })
            .attr("x2", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() * 3 / 4; // Adjust the x position to align with the whisker
            })
            .attr("y2", function(d) {
                return yScale(d.upperWhisker);
            })),
        (exit) => exit
            .call((exit) => exit.transition().duration(500).attr("opacity", 0))
            .remove()
        );

        // Add the min and max labels to the chart
        bpel.selectAll(".min-label")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("text")
            .attr("class", "min-label")
            .attr("x", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 2;
            })
            .attr("y", function(d) {
                return yScale(d.lowerWhisker) + 15;
            })
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d3.format("$,.0f")(d.lowerWhisker);
            })
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("x", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 2;
                })
                .attr("y", function(d) {
                return yScale(d.lowerWhisker) + 15;
                })
                .text(function(d) {
                return d3.format("$,.0f")(d.lowerWhisker);
                })),
            (exit) => exit
            .call((exit) => exit.transition().duration(500).attr("opacity", 0))
            .remove()
        );

        bpel.selectAll(".max-label")
        .data(boxplotData)
        .join(
            (enter) => enter
            .append("text")
            .attr("class", "max-label")
            .attr("x", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 2;
            })
            .attr("y", function(d) {
                return yScale(d.upperWhisker) - 5;
            })
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d3.format("$,.0f")(d.upperWhisker);
            })
            .attr("opacity", 0)
            .call((enter) => enter.transition().duration(500).attr("opacity", 1)),
            (update) => update
            .call((update) => update.transition().duration(500)
                .attr("x", function(d) {
                return xScale(d.experienceLevel) + xScale.bandwidth() / 2;
                })
                .attr("y", function(d) {
                return yScale(d.upperWhisker) - 5;
                })
                .text(function(d) {
                return d3.format("$,.0f")(d.upperWhisker);
                })),
            (exit) => exit
            .call((exit) => exit.transition().duration(500).attr("opacity", 0))
            .remove()
        );

        // Create tooltip
        const tooltip = d3.select("#tooltipEL");

        // Add event listeners to show/hide tooltips
        bpel.selectAll(".box, .dot, .min-label, .max-label")
        .on("mouseover", function(event, d) {
            // Calculate tooltip position
            const xPosition = xScale(d.experienceLevel) + 1430;
            const yPosition = yScale(d.median) + 600;
            
            // Build tooltip HTML content
            const tooltipContent = `
            <strong>Experience Level:</strong> ${d.experienceLevel}<br>
            <strong>Median:</strong> $${d.median}<br>
            <strong>Q1:</strong> $${d.q1}<br>
            <strong>Q3:</strong> $${d.q3}<br>
            <strong>Lower Whisker:</strong> $${d.lowerWhisker}<br>
            <strong>Upper Whisker:</strong> $${d.upperWhisker}<br>
            <strong>Outliers:</strong> ${d.outliers.join(", ")}
            `;
            
            // Set tooltip content and position
            tooltip
            .html(tooltipContent)
            .style("left", xPosition + "px")
            .style("top", yPosition + "px")
            .style("display", "block");
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.style("display", "none");
        });

        // Add x-axis
        bpel.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

        // Add x-axis title
        bpel.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Experience Level");

        // Add y-axis
        bpel.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

        // Add y-axis title
        bpel.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Salary");
        

        // Add chart title
        bpel.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text("Salary Distribution by Experience Level");
    }
    
    var defaultYear = "2020";
    createBoxPlots(parseInt(defaultYear));
    document.getElementById("myRange").addEventListener("change", function(event) {
        var selectedYear = event.target.value;
        defaultYear = selectedYear
        createBoxPlots(parseInt(selectedYear));
    });
        
    // Call the updateChart function with the default year

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
        var year = parseInt(defaultYear) + 1;
        defaultYear = year.toString();
        if(defaultYear == "2024"){
            defaultYear = "2020";
        }
        // Use the modified value as needed
        console.log(defaultYear);
        createBoxPlots(parseInt(defaultYear));
    }
  
});