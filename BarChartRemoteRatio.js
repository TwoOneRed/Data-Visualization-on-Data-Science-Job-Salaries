var data;
var chartRRWidth = 700;
var chartRRHeight = 220;
var marginRR = { top: 80, right:0, bottom: 70, left:100};
var innerRRWidth = chartRRWidth - margin.left - margin.right;
var innerRRHeight = chartRRHeight - margin.top - margin.bottom;

var barchartRR = d3.select("#barrrchart")
    .style("width", chartRRWidth)
    .style("height", chartRRHeight);

var bcRR = barchartRR.append("svg")
    .attr("width", chartRRWidth-250)
    .attr("height", chartRRHeight)
    .append("g")
    .attr("transform", "translate(" + marginRR.left + "," + marginRR.top + ")");

var tooltipRR = d3.select("#tooltipRR");

function updateChart(year) {
    var sal_by_remote_ratio = Array.from(data.get(year))
    .sort((a, b) => a[1][0].remote_ratio - b[1][0].remote_ratio);

    var remoteRatios = sal_by_remote_ratio.map(d => d[1][0].remote_ratio);
    var avgSalaries = sal_by_remote_ratio.map(d => Number(d3.mean(d[1], e => Number(e.salary_in_usd))));

    var xScale = d3.scaleBand()
    .domain(remoteRatios.map(String))
    .range([0, innerRRWidth])
    .padding(0.1);

    var yScale = d3.scaleLinear()
    .domain([0, d3.max(avgSalaries) + 20000])
    .range([innerRRHeight, 0]);

    // Remove old chart elements
    bcRR.selectAll(".bar").remove();
    bcRR.selectAll(".bar-label").remove();
    bcRR.select(".x-axis").remove();
    bcRR.select(".y-axis").remove();
    bcRR.select(".chart-title").remove();
    bcRR.select(".y-axis-title").remove();
    bcRR.select(".x-axis-title").remove();

    // Update existing bars
    bcRR.selectAll(".bar")
    .data(avgSalaries)
    .attr("x", (d, i) => xScale(String(remoteRatios[i])))
    .attr("y", innerRRHeight)
    .attr("height", 0)
    .transition()
    .duration(800)
    .attr("y", d => yScale(d))
    .attr("height", d => innerRRHeight - yScale(d));

    // Create new bars for entering data
    bcRR.selectAll(".bar")
    .data(avgSalaries)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d, i) => xScale(String(remoteRatios[i])))
    .attr("y", innerRRHeight)
    .attr("width", xScale.bandwidth())
    .attr("height", 0)
    .attr("data-fill-color", function(d, i) {
        var remoteRatio = remoteRatios[i];
        if (remoteRatio === "100") {
        return "#66c2a5"; // Remote Work
        } else if (remoteRatio === "50") {
        return "#fc8d62"; // Hybrid
        } else if (remoteRatio === "0") {
        return "#8da0cb"; // No Remote Work
        }
    })
    .style("fill", function(d, i) {
        return d3.select(this).attr("data-fill-color");
    })
    .on("mouseover", function(event, d, i) {
          tooltipRR.transition()
            .duration(0)
            .style("opacity", 0.9);

          // Calculate tooltip position
          var tooltipX = event.pageX + 5;
          var tooltipY = event.pageY + 10;

          tooltipRR.html("Average Salary (USD):<br> $" + Number(d).toFixed(2))
            .style("left", tooltipX + "px")
            .style("top", tooltipY + "px");
    })
    .on("mouseout", function() {
        d3.select(this)
        .style("fill", function() {
          return d3.select(this).attr("data-fill-color");
        });

      tooltipRR.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .transition()
    .duration(800)
    .attr("y", d => yScale(d))
    .attr("height", d => innerRRHeight - yScale(d));

    bcRR.selectAll(".bar-label")
    .data(avgSalaries)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", (d, i) => xScale(String(remoteRatios[i])) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d) - 5)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text(d => "$" + Number(d).toFixed(2))
    .style("fill", "black");

    bcRR.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + innerRRHeight + ")")
    .call(d3.axisBottom(xScale).tickFormat(function(d) {
        if (d === "0") {
        return "No Remote Work";
        } else if (d === "50") {
        return "Hybrid";
        } else if (d === "100") {
        return "Remote Work";
        } else {
        return "";
        }
    }))
    .selectAll("text")
    .style("font-size", "12px");

    bcRR.append("g")
    .attr("class", "y-axis")
    .transition()
    .duration(800)
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("$,.0f")))
    .selectAll("text")
    .style("font-size", "12px");

    barchartRR.selectAll(".axis")
    .selectAll("text")
    .attr("font-size", "14px");

    bcRR.append("text")
    .attr("class", "x-axis-title")
    .attr("transform", "translate(" + (innerRRWidth / 2) + " ," + (innerRRHeight + margin.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("Remote Ratio")
    .style("font-size", "16px")
    .style("font-weight", "bold");

    bcRR.append("text")
    .attr("class", "y-axis-title")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - marginRR.left)
    .attr("x", 0 - (innerRRHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Average Salary (USD)")
    .style("font-size", "16px")
    .style("font-weight", "bold");

    bcRR.append("text")
    .attr("class", "chart-title")
    .attr("x", innerRRWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Salary by Remote Ratio (" + year + ")");
}

d3.csv("ds_salaries.csv").then(function(dataset) {
    data = d3.group(dataset, d => d.work_year, d => d.remote_ratio);

    var defaultYear = "2020";
    updateChart(defaultYear);
    document.getElementById("myRange").addEventListener("change", function(event) {
        var selectedYear = event.target.value;
        defaultYear = selectedYear
        updateChart(selectedYear);
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
        updateChart(defaultYear);
    }
});