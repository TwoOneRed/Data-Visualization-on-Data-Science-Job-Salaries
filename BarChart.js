var chartWidth = 900;
var chartHeight = 250;
var margin = { top: 50, right: 150, bottom: 70, left: 250};
var innerWidth = chartWidth - margin.left - margin.right;
var innerHeight = chartHeight - margin.top - margin.bottom;

var barchart = d3.select("#barchart")
    .style("width", chartWidth + "px")
    .style("height", chartHeight + "px");

var chart = barchart.append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("#tooltip");


d3.csv("ds_salaries.csv").then(function(dataset) {
    var data = d3.group(dataset, d => d.work_year, d => d.job_title);    

    function updateChart(year) {
        var sal_by_title = Array.from(data.get(year))
            .sort((a, b) => b[1][0].salary_in_usd - a[1][0].salary_in_usd)
            .slice(0, 10);
    
        var jobTitles = sal_by_title.map(d => d[1][0].job_title);
        var salaries = sal_by_title.map(d => Number(d[1][0].salary_in_usd));
    
        var xScale = d3.scaleLinear()
        .domain([0, 450000])
        .range([0, innerWidth]);
    
        var yScale = d3.scaleBand()
        .domain(jobTitles)
        .range([0, innerHeight])
        .padding(0.1);
    
        // Remove old chart elements
        chart.selectAll(".bar").remove();
        chart.selectAll(".bar-label").remove();
        chart.select(".x-axis").remove();
        chart.select(".y-axis").remove();
        chart.select(".chart-title").remove();
        chart.select(".y-axis-title").remove();
        chart.select(".x-axis-title").remove();
    
        // Create new chart elements
        chart.selectAll(".bar")
        .data(salaries)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", (d, i) => yScale(jobTitles[i]))
        .attr("width", 0)
        .attr("height", yScale.bandwidth())
        .style("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this)
            .style("fill", "orange");
    
            tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
    
            var barIndex = Array.from(this.parentNode.children).indexOf(this);
            var barRect = this.getBoundingClientRect();
            var tooltipX = barRect.right + 10;  // Fixed position: right side of the bar + 10px
            var tooltipY = barRect.top + barRect.height / 2;  // Fixed position: vertically centered with the bar
    
            tooltip.html("Job Title: " + jobTitles[barIndex] + "<br>"
            + "Salary (USD): " + salaries[barIndex])
            .style("left", tooltipX + "px")
            .style("top", tooltipY + "px");
        })
        .on("mouseout", function(d, i) {
            d3.select(this)
            .style("fill", "steelblue");
    
            tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        })
        .transition()
        .duration(1000)
        .attr("width", d => xScale(d));
    
        chart.selectAll(".bar-label")
        .data(salaries)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d) + 5)
        .attr("y", (d, i) => yScale(jobTitles[i]) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => "$" + Number(d).toFixed(2))
        .style("fill", "black");
    
        chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-size", "12px");
    
        chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "12px");
    
        svg.selectAll(".axis")
        .selectAll("text")
        .attr("font-size", "14px");
    
        chart.append("text")
        .attr("class", "x-axis-title")
        .attr("transform", "translate(" + (innerWidth / 2) + " ," + (innerHeight + margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .text("Salary (USD)")
        .style("font-size", "16px")
        .style("font-weight", "bold");
    
        chart.append("text")
        .attr("class", "y-axis-title")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (innerHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Job Title")
        .style("font-size", "16px")
        .style("font-weight", "bold");
    
        chart.append("text")
        .attr("class", "chart-title")
        .attr("x", innerWidth / 2)
        .attr("y", 0 - margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Top 10 Salaries by Job Title (" + year + ")");
    }
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

