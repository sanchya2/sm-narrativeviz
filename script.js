//Global set up and configuration
const margin = {top: 10, right: 30, bottom: 30, left: 100},
    width = 1100 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const svgContainer = d3.select('#visualization')
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

const chartG = svgContainer.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


const prevButton = d3.select("#prevScene");
const nextButton = d3.select("#nextScene");
const narrativeTextDiv = d3.select("#narrative-text")

const totalScenes = 3
let currentSceneIndex = 0

let co2_annual_data = [];
let co2_fuel_type_2023 = []

let sharedYScale; //For consistent y-axis

document.addEventListener("DOMContentLoaded", function () {
  setUpSceneLoadData();
});

//Data Loading 

async function setUpSceneLoadData(){
    co2_annual_data = await d3.csv("annual-co2-emissions.csv", d => ({
        date: new Date(+d.year, 0, 1),
        mean: +d.annual_co2_emissions
}));

    co2_fuel_type_2023 = await d3.csv("co2-emissions-by-type_2023.csv", d => ({
        Type: d.Type,
        annual_co2_emissions: +d.annual_co2_emissions
}));

console.log(co2_annual_data);
console.log(co2_fuel_type_2023);

sharedYScale = d3.scaleLinear()
.domain([d3.min(co2_annual_data, d=> d.mean)-1, d3.max(co2_annual_data, d => d.mean) + 1])
.nice()
.range([height,0]);

updateScene(currentSceneIndex);
updateButtons();
}


//Scene orchestrator/transitioning function, make sure to clear exisiting svg

function updateScene(sceneIndex){
    //clear current chart
    chartG.selectAll("*").remove();
    //set up scene based on index
    if(sceneIndex == 0){
        narrativeTextDiv.html("<h3>Scene 1</h3>")
        drawScene1PreRise(co2_annual_data, sharedYScale);
    }else if (sceneIndex == 1){
        narrativeTextDiv.html("<h3>Scene 2</h3>")
        drawScene2PostRise(co2_annual_data, sharedYScale);
    }else if (sceneIndex == 2){
        narrativeTextDiv.html("<h3>Scene 3</h3>")
        drawBarGraphScene3(co2_fuel_type_2023);
    }
}

//update Navigation buttons

function updateButtons(){
    if (currentSceneIndex === 0){
        prevButton.attr('disabled', true);
    }else{
        prevButton.attr('disabled', null);
    }

    if(currentSceneIndex === totalScenes - 1){
        nextButton.attr('disabled', true);
    }else{
        nextButton.attr('disabled', null);
    }
}

//Individual scene drawing functions

function drawScene1PreRise (data, yScale){
    data = data.filter(d => d.date.getFullYear() <= 1950);
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    //const y = d3.scaleLinear()
    //    .domain([d3.min(data, d => d.mean) - 1, d3.max(data, d => d.mean)])
        //.domain(yAxisConsistent)
    //    .nice()
    //    .range([height, 0])

    const xAxis = d3.axisBottom(x)
    //const yAxis = d3.axisLeft(y)
    const yAxis = d3.axisLeft(yScale)

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
        //.y(d => y(d.mean));
        .y(d => yScale(d.mean));

    const path = chartG.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", line);

    const totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(6500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    
    const industrialRevolution = data.find(d => d.year === 1780)
    const annotations = [
        {
            note: {
                label: "Here is the annotation label",
                title: "Annotation title"
            },
            x: 50,
            y: 50,
            dy: 100,
            dx: 100
        }
    ]

    const makeAnnotations = d3.annotation()
    .annotations(annotations);
    chartG.append("g")
    .call(makeAnnotations);
}

function drawScene2PostRise(data, yScale){
    data = data.filter(d => d.date.getFullYear() >= 1940);
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.mean) - 1, d3.max(data, d => d.mean)])
        .nice()
        .range([height, 0])

    const xAxis = d3.axisBottom(x)
    //const yAxis = d3.axisLeft(y)
    const yAxis = d3.axisLeft(yScale);

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
        //.y(d => y(d.mean));
        .y(d => yScale(d.mean));

    const path = chartG.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
    
    const totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);
}

function drawBarGraphScene3(data){
    console.log("Loading bar chart")
    
    const x = d3.scaleBand()
    .domain(data.map(d => d.Type))
    .range([0, width])
    .padding(0.1);

    const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.annual_co2_emissions)])
    .nice()
    .range([height, 0]);

    chartG.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

    chartG.append("g")
    .call(d3.axisLeft(y));

    chartG.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.Type))
    //.attr("y", d => y(d.annual_co2_emissions))
    .attr("y", height)
    .attr("width", x.bandwidth())
    //.attr("height", d => height - y(d.annual_co2_emissions))
    .attr("height", 0)
    .attr("fill", "steelblue")
    .transition()
    .duration(1000)
    .ease(d3.easeExpOut)
    .attr("y", d => y(d.annual_co2_emissions))
    .attr("height", d => height - y(d.annual_co2_emissions));
}

//Navigation event listeners and helpers

prevButton.on("click", () => {
    if(currentSceneIndex > 0){
        currentSceneIndex --;
        updateScene(currentSceneIndex);
        updateButtons();
    }
});

nextButton.on("click", () => {
    if(currentSceneIndex < (totalScenes-1)){
        currentSceneIndex ++;
        updateScene(currentSceneIndex);
        updateButtons();
    }
    
});

