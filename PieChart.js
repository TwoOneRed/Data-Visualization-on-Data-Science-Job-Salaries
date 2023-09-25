var piechartWidth = 400;
var piechartHeight = 180;
var piemargin = { top: 0, right:0, bottom: 0, left: 0};
const radius = Math.min(piechartWidth, piechartHeight) / 2 - 10;
const colorScale = d3.scaleOrdinal()
      .range(["#66c2a5", "#fc8d62", "#8da0cb"]);

var piechart = d3.select("#PieChart")
    .style("width", piechartWidth + "px")
    .style("height", piechartHeight + "px");

var piec = piechart.append("svg")
    .attr("width", piechartWidth)
    .attr("height", piechartHeight)
    .append("g")
    .attr("transform", `translate(${piechartWidth / 2}, ${piechartHeight / 2})`);

d3.csv("ds_salaries.csv").then(function(csvData) {
    let data = csvData;
    workRatioData = [
        { work_ratio: "100", remote_ratio: "Remote Work" },
        { work_ratio: "50", remote_ratio: "Hybrid" },
        { work_ratio: "0", remote_ratio: "No Remote Work" }
    ];

    // Add color bar legends
    const legendContainer = d3.select("#legend-containerPIE");
    const legends = legendContainer.selectAll(".legend")
        .data(workRatioData)
        .enter()
        .append("div")
        .attr("class", "legendPIE");

    legends.append("div")
        .attr("class", "legend-colorPIE")
        .style("background-color", (d, i) => colorScale(workRatioData[i].work_ratio));

    legends.append("div")
        .text(d => d.remote_ratio);

    var defaultYear = "2020";
    updatePieChart(defaultYear);
    
    document.getElementById("myRange").addEventListener("change", function(event) {
      console.log("DIU NEI")
      var selectedYear = event.target.value;
      defaultYear = selectedYear
      updatePieChart(selectedYear);
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
        var year = parseInt(defaultYear) + 1;
        defaultYear = year.toString();
        if(defaultYear == "2024"){
            defaultYear = "2020";
        }
        // Use the modified value as needed
        console.log(defaultYear);
        updatePieChart(defaultYear);
    }
    function updatePieChart(selectedYear) {
      const filteredData = data.filter(d => d.work_year === selectedYear);
      const totalCount = filteredData.length;
  
      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
  
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
  
      const remoteRatioData = workRatioData.map(d => {
        const ratioCount = getRatioCount(filteredData, d.work_ratio);
        return {
          remote_ratio: d.remote_ratio,
          count: ratioCount.count,
          percentage: ratioCount.percentage
        };
      });
  
      const arcs = piec.selectAll(".arc")
        .data(pie(remoteRatioData));
  
      arcs.exit().remove();
  
      const newArcs = arcs.enter()
        .append("g")
        .attr("class", "arc");
  
      newArcs.append("path")
        .attr("class", "slice")
        .attr("fill", (d, i) => colorScale(workRatioData[i].work_ratio))
        .attr("opacity", 0)
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .merge(arcs.select("path"))
        .transition()
        .duration(1000)
        .attr("opacity", 1)
        .attrTween("d", function(d) {
          const interpolate = d3.interpolate(this._current || { startAngle: 0, endAngle: 0 }, d);
          this._current = interpolate(0);
          return function(t) {
            return arc(interpolate(t));
          };
        });
  
      newArcs.append("text")
        .attr("class", "percentage")
        .attr("opacity", 0)
        .merge(arcs.select(".percentage"))
        .transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dx", d => (selectedYear === "2022" || selectedYear === "2023") ? "1em" : null)
        .attr("dy", d => (selectedYear === "2022" || selectedYear === "2023") ? "0em" : null)
        .text(d => `${d.data.percentage.toFixed(2)}%`);
  
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
  
      newArcs
        .on("mouseover", function(event, d) {
          const tooltipText = `Remote Ratio: ${d.data.remote_ratio} <br> Count: ${d.data.count} people <br> Percentage: ${d.data.percentage.toFixed(2)}%`;
  
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
  
          tooltip.html(tooltipText);
        })
        .on("mousemove", function(event) {
          tooltip.style("left", `${event.pageX}px`)
            .style("top", `${event.pageY}px`); 
        })
        .on("mouseout", function() {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
  
      function getRatioCount(data, ratio) {
          const count = data.filter(d => d.remote_ratio === ratio).length;
          const percentage = (count / totalCount) * 100;
          return { count, percentage };
      }
  }
});


