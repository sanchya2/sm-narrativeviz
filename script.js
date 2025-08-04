//Global set up and configuration
const margin = {top: 80, right: 100, bottom: 30, left: 150},
    width = 1400 - margin.left - margin.right,
    height = 650 - margin.top - margin.bottom;

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
let co2_country_emissions = [];

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

    co2_country_emissions = await d3.csv("co2_emissions_type_country.csv", d => ({
        country: d.Country,
        oil: +d.Oil,
        coal: +d.Coal,
        cement: +d.Cement,
        gas: +d.Gas,
        flaring: +d.Flaring,
        other_industry: +d["Other Industry"]
    }))

console.log(co2_annual_data);
console.log(co2_country_emissions);

const reshapedCountryEmissions = [];
co2_country_emissions.forEach(d => {
    reshapedCountryEmissions.push(
        { country: d.country, type: "Oil", emissions: d.oil },
        { country: d.country, type: "Coal", emissions: d.coal },
        { country: d.country, type: "Cement", emissions: d.cement },
        { country: d.country, type: "Gas", emissions: d.gas },
        { country: d.country, type: "Flaring", emissions: d.flaring },
        { country: d.country, type: "Other Industry", emissions: d.other_industry }
    );
});

//console.log(reshapedCountryEmissions);
co2_country_emissions = reshapedCountryEmissions;

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
    const countryContainer = d3.select("#country-container");
    //set up scene based on index
    if(sceneIndex == 0){
        narrativeTextDiv.html(`
        <h3>The Early Chapters of CO2 Emissions</h3>
        <p>This visualization explores the rapid increase and causes of global CO2 emissions. These emissions are the primary driver of human-caused climate change.</p>
        <p>This scene shows annual emissions from 1750 to 1950. We see the initial low levels and the gentle, almost imperceptible, rise as the Industrial Revolution began to unfold.</p>
        <p><strong>Use the Next and Previous buttons above to navigate the story.</strong></p>
        `);
        countryContainer.style("display", "none");
        drawScene1PreRise(co2_annual_data, sharedYScale);
    }else if (sceneIndex == 1){
        narrativeTextDiv.html(`
        <h3>The Accelerating Rise and Its Global Impacts</h3>
        <p>Following the 1950s, global CO2 emissions began a dramatic and unprecedented acceleration. This rapid increase has led to profound changes in our climate.</p>
        <p>Key impacts are highlighted along the timeline, directly linking rising emissions to real-world consequences across the globe.</p>
        <p><strong>Use the Next and Previous buttons to continue navigating the story.</strong></p>
        `);
        countryContainer.style("display", "none");
        drawScene2PostRise(co2_annual_data, sharedYScale);
    }else if (sceneIndex == 2){
        narrativeTextDiv.html(`
        <h3>Understanding Global Emission Sources in 2023</h3>
        <p>To tackle climate change, we must understand its sources. This chart breaks down global CO2 emissions by major fuel type in 2023. 
        <p>You can use the dropdown menu to filter emissions by country, and hover over each bar to explore precise emission figures.</p>
        `);
        countryContainer.style("display", "block");
        drawBarGraphScene3(co2_country_emissions);
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

    const xAxis = d3.axisBottom(x)
    const yAxis = d3.axisLeft(yScale)

    chartG.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    //x-axis label
    chartG.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Year");

    chartG.append("g")
        .call(yAxis)
        .append("text")
        .attr("fill", "black")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("CO2 Emissions (tonnes)");

    const line = d3.line()
        .x(d => x(d.date))
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
        //.duration(6500)
        //.ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    
    //Industrial Revolution Begins
    const industrial_1750 = data.find(d => d.date.getFullYear() === 1750);
    const industrial_1750_X = x(industrial_1750.date);
    const industrial_1750_Y = yScale(industrial_1750.mean);

    //First CO2 Scientific Warning
    const co2_warning_1896 = data.find(d => d.date.getFullYear() === 1896);
    const co2_warning_1896_X = x(co2_warning_1896.date);
    const co2_warning_1896_Y = yScale(co2_warning_1896.mean);

    //early1900s
    const early1900s = data.find(d => d.date.getFullYear() === 1900);
    const early1900sX = x(early1900s.date);
    const early1900sY = yScale(early1900s.mean);
    const annotations = [
        {
            note: {
                label: "Mid 1700s: Industrial Revolution Begins, initiating fossil fuel use",
                title: "Industrial Revolution Begins"
            },
            x: industrial_1750_X,
            y: industrial_1750_Y,
            dy: -60,
            dx: 60,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        },
        {
            note: {
                label: "1896: Scientist Svante Arrhenius theorizes CO2's greenhouse effect",
                title: "First Scientific CO2 Warning"
            },
            x: co2_warning_1896_X,
            y: co2_warning_1896_Y,
            dy: -60,
            dx: -60,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        },
        {
            note: {
                label: "Early 1900s: Global Industrialization expands, driving gradual C02 increase",
                title: "Early 20th Century Expansion"
            },
            x: early1900sX,
            y: early1900sY,
            dy: -60,
            dx: 60,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        }
    ]
    //const makeAnnotations = d3.annotation()
    //.annotations(annotations);
    //chartG.append("g")
    //.call(makeAnnotations);
    const annotationGroup = chartG.append("g")
    .attr("class", "annotation-group");

    path.transition()
    .duration(3500)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0)
    .on("end", () => {
        annotations.forEach((a, i) => {
            const single = d3.annotation().annotations([a]);
            const group = annotationGroup.append("g")
            .style("opacity", 0)
            .call(single);

            group.transition()
            .delay(i * 1000)
            .duration(800)
            .style("opacity", 1);
        }
        )
    });
}

function drawScene2PostRise(data, yScale){
    data = data.filter(d => d.date.getFullYear() >= 1940);
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const xAxis = d3.axisBottom(x)
    const yAxis = d3.axisLeft(yScale);

    chartG.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    //x-axis label
    chartG.append("text")
        .attr("x", width / 2 + 40)
        .attr("y", height + margin.bottom)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");

    chartG.append("g")
        .call(yAxis)
        .append("text")
        .attr("fill", "black")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text("CO2 Emissions (tonnes)");

    const line = d3.line()
        .x(d => x(d.date))
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
    //.duration(1000)
    //.ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);

    //1950 Post WW2 Boom
    const post_ww2_1950 = data.find(d => d.date.getFullYear() === 1950);
    const post_ww2_1950X = x(post_ww2_1950.date);
    const post_ww2_1950Y = yScale(post_ww2_1950.mean);

    //1988 Critical Threshold Exceeded
    const critical_1988 = data.find(d => d.date.getFullYear() === 1988);
    const critical_1988X = x(critical_1988.date);
    const critical_1988Y = yScale(critical_1988.mean);

    //2003 European HeatWave
    const heatwave_2003 = data.find(d => d.date.getFullYear() === 2003);
    const heatwave_2003X = x(heatwave_2003.date);
    const heatwave_2003Y = yScale(heatwave_2003.mean);

    //2020 WildFire Records Broken
    const wildfire_2020 = data.find(d => d.date.getFullYear() === 2020);
    const wildfire_2020X = x(wildfire_2020.date);
    const wildfire_2020Y = yScale(wildfire_2020.mean);

    //2023 Latest CO2 Level
    const latest_2023 = data.find(d => d.date.getFullYear() === 2023);
    const latest_2023X = x(latest_2023.date);
    const latest_2023Y = yScale(latest_2023.mean);

    const annotations = [
        {
            note: {
                label: "1950s: Post-WW2 boom, human activity drives sharp CO2 surge",
                title: "Post-WW2 Boom: Crucial Turning Point",
                wrap: 160,
                align: "left"
            },
            x: post_ww2_1950X,
            y: post_ww2_1950Y,
            dy: -100,
            dx: -80,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        },
        
        {
            note: {
                label: "1988: CO2 levels exxceeded 350ppm, a critical threshold for climate stability",
                title: "Critical CO2 Level Surpassed",
                wrap: 160,
                align: "right"
            },
            x: critical_1988X,
            y: critical_1988Y,
            dy: -90,
            dx: -80,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        },
        {
            note: {
                label: "2003: Devastating European heatwave, record temperatures with rising CO2",
                title: "Real-World Impact: 2003 European Heatwave",
                wrap: 140,
                align: "right"
            },
            x: heatwave_2003X,
            y: heatwave_2003Y,
            dy: 120,
            dx: -30,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        },
        {
            note: {
                label: "2020: Record wildfire seasons, intensified by climate change",
                title: "Real-World Impact: Extreme Wildfires",
                wrap: 140,
                align: "right"
            },
            x: wildfire_2020X,
            y: wildfire_2020Y,
            dy: -20,
            dx: -170,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        },
        
        {
            note: {
                label: `2023 Current CO2 Level is ${(latest_2023.mean / 1e9).toFixed(2)} billion tonnes`,
                title: "Current CO2 Level",
                wrap: 150,
                align: "right"
            },
            x: latest_2023X,
            y: latest_2023Y,
            dy: 120,
            dx: 0,
            type: d3.annotationCalloutCircle,
            subject: {radius: 5}
        }
    ]
    /*
    const makeAnnotations = d3.annotation()
    .annotations(annotations);
    chartG.append("g")
    .call(makeAnnotations);
    */

    const annotationGroup = chartG.append("g")
    .attr("class", "annotation-group");
    
    path.transition()
    .duration(1200)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0)
    .on("end", () => {
        annotations.forEach((a, i) => {
            const single = d3.annotation().annotations([a]);
            const group = annotationGroup.append("g")
            .style("opacity", 0)
            .call(single);

            group.transition()
            .delay(i * 850)
            .duration(800)
            .style("opacity", 1);
        }

        )
    });
    
}

function drawBarGraphScene3(data){
    const countrySelect = d3.select("#country-select");
    const countries = [... new Set(data.map(d => d.country))];

    countrySelect.selectAll("option").remove();
    countrySelect.selectAll("option")
    .data(countries)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

    let selectedCountry = "World";
    countrySelect.property("value", selectedCountry);

    function updateChart(countryName){
        chartG.selectAll("*").remove();
        const countryData = data.filter(d => d.country == countryName);

        const x = d3.scaleBand()
            .domain(countryData.map(d => d.type))
            .range([0, width])
            .padding(0.1);
        
        const y = d3.scaleLinear()
            .domain([0, d3.max(countryData, d => d.emissions)])
            .nice()
            .range([height, 0]);
        
        chartG.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "middle");

        chartG.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Emission Cause");
        
        chartG.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "black")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 30)
            .attr("x", -height / 2)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .text("CO2 Emissions (tonnes)");

        let tooltip = d3.select("body").select(".tooltip");
            if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        }

        chartG.selectAll("rect")
            .data(countryData)
            .enter()
            .append("rect")
            .attr("x", d => x(d.type))
            .attr("y", height)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(
                `<strong>Fuel Type:</strong> ${d.type}<br>` +
                `<strong>Emissions:</strong> ${(d.emissions / 1e6).toFixed(2)} million tonnes`
            )
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");

        d3.select(this)
          .attr("stroke", "black")
          .attr("stroke-width", 2);
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
        d3.select(this)
          .attr("stroke", "none")
          .attr("stroke-width", 0);
      })
      .transition()
      .duration(1000)
      .ease(d3.easeExpOut)
      .attr("y", d => y(d.emissions))
      .attr("height", d => height - y(d.emissions));
    }
    updateChart(selectedCountry);
        countrySelect.on("change", function () {
        selectedCountry = this.value;
        updateChart(selectedCountry);
    });

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

