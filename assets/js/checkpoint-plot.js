const times = [7.10, 6.24, 6.11, 6.09, 6.10, 6.07, 6.05, 6.03];
const memory = [1525.88, 305.18, 152.59, 30.52, 15.26, 3.05, 1.53, 0.31];
const checkpoints = [10, 50, 100, 500, 1000, 5000, 10000, 50000];

const data = memory.map((mem, i) => ({
  memory: mem,
  time: times[i],
  checkpoints: checkpoints[i]
}));

const width = 1000;
const height = 600;
const margin = { top: 50, right: 70, bottom: 50, left: 70 };

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// title
svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "20px")
    .attr("fill", "black")
    .text("Gradient Checkpointing: Time–Memory Tradeoff");

// scales
const xScale = d3.scaleLog()
    .domain([d3.min(memory), d3.max(memory)])
    .range([margin.left, width - margin.right]);

const yScale = d3.scaleLinear()
    .domain([d3.min(times) - 0.2, d3.max(times) + 0.2])
    .range([height - margin.bottom, margin.top]);

// axes
const xAxis = d3.axisBottom(xScale).ticks(10, "~s");
const yAxis = d3.axisLeft(yScale);

svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

svg.append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

// Axis Labels
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Memory Usage (MB, log scale)");

svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Execution Time (s)");

// line
const line = d3.line()
  .x(d => xScale(d.memory))
  .y(d => yScale(d.time));

svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);

// circles
svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.memory))
    .attr("cy", d => yScale(d.time))
    .attr("r", 6)
    .attr("fill", "orange");
    
svg.selectAll("text.k-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "k-label")
    .attr("x", d => xScale(d.memory))
    .attr("y", d => yScale(d.time) - 10)  // offset above circle
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", "black")
    .text(d => `K=${d.checkpoints}`);

// --- Axis markers ---
const xMarker = svg.append("line")
  .attr("stroke", "gray")
  .attr("stroke-dasharray", "4")
  .style("opacity", 0);

const yMarker = svg.append("line")
  .attr("stroke", "gray")
  .attr("stroke-dasharray", "4")
  .style("opacity", 0);

const xLabel = svg.append("text")
  .attr("class", "axis-label")
  .attr("text-anchor", "middle")
  .style("opacity", 0);

const yLabel = svg.append("text")
  .attr("class", "axis-label")
  .attr("text-anchor", "end")
  .style("opacity", 0);

// --- Side info box ---
const infoBox = d3.select("#info-box");

svg.selectAll("circle")
  .on("mouseover", function(event, d) {
    // highlight circle
    d3.select(this).transition().attr("r", 10).attr("fill", "red");

    // axis markers
    xMarker
      .attr("x1", xScale(d.memory))
      .attr("x2", xScale(d.memory))
      .attr("y1", yScale(d.time))
      .attr("y2", height - margin.bottom)
      .style("opacity", 1);

    yMarker
      .attr("x1", margin.left)
      .attr("x2", xScale(d.memory))
      .attr("y1", yScale(d.time))
      .attr("y2", yScale(d.time))
      .style("opacity", 1);

    // labels
    xLabel
      .attr("x", xScale(d.memory))
      .attr("y", height - margin.bottom + 20)
      .text(`${d.memory.toFixed(2)} MB`)
      .style("opacity", 1);

    yLabel
      .attr("x", margin.left - 5)
      .attr("y", yScale(d.time))
      .text(`${d.time.toFixed(2)} s`)
      .style("opacity", 1);

    // side info box
    infoBox.html(`
      <p><strong>Checkpoint Interval (K):</strong> ${d.checkpoints}</p>
      <p><strong>Memory:</strong> ${d.memory.toFixed(2)} MB</p>
      <p><strong>Time:</strong> ${d.time.toFixed(2)} s</p>
    `);
  })
  .on("mouseout", function() {
    d3.select(this).transition().attr("r", 6).attr("fill", "orange");

    xMarker.style("opacity", 0);
    yMarker.style("opacity", 0);
    xLabel.style("opacity", 0);
    yLabel.style("opacity", 0);

    infoBox.html(`<p>Hover over a point to see details.</p>`);
  });
