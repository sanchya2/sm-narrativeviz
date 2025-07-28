const margin = {top: 10, right: 30, bottom: 30, left: 60},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

const svgContainer = d3.select('#visualization')
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const chartG = svgContainer.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("co2rateannual.csv", d => {
    return {
        date: new Date(+d.year, 0, 1),
        mean: +d.mean
    };
}).then(data => {
    console.log(data);

    const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

    const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.mean) - 1, d3.max(data, d => d.mean)])
    .nice()
    .range([height, 0])

    const xAxis = d3.axisBottom(x)
    const yAxis = d3.axisLeft(y)

    chartG.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

    chartG.append("g")
    .call(yAxis);

    const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.mean));

    chartG.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

});