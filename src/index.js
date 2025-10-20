import {SpaceX} from "./api/spacex";
import * as d3 from "d3";
import * as Geo from './geo.json'

document.addEventListener("DOMContentLoaded", setup)

function setup(){
    const spaceX = new SpaceX();
    spaceX.launches().then(launches=>{
        spaceX.launchpad().then(launchpads => {
            const listContainer = document.getElementById("listContainer")
            renderLaunches(launches, listContainer, );
            drawMap(launchpads);
        })
    })
}
function renderLaunches(launches, container, launchpads){
    const list = document.createElement("ul");

    launches.forEach(launch => {
        const item = document.createElement("li");
        item.textContent = launch.name;

        // Наведение на элемент списка — подсветка соответствующего launchpad
        item.addEventListener("mouseover", () => {
            d3.selectAll(".pad-point").classed("highlight", false);
            const pad = launchpads.find(p => p.id === launch.launchpad);
            if (pad) {
                d3.selectAll(".pad-point")
                    .filter(d => d.id === pad.id)
                    .classed("highlight", true)
                    .raise();
            }
        });

        item.addEventListener("mouseout", () => {
            d3.selectAll(".pad-point").classed("highlight", false);
        });

        list.appendChild(item);
    });

    container.replaceChildren(list);
}

function drawMap(launchpads){
    const width = 640;
    const height = 480;
    const margin = {top: 20, right: 10, bottom: 40, left: 100};
    const svg = d3.select('#map').append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
    const projection = d3.geoMercator()
        .scale(70)
        .center([0,20])
        .translate([width / 2 - margin.left, height / 2]);
    const g = svg.append("g");
    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "#fff")
        .style("padding", "5px 8px")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Точки launchpads
    g.selectAll(".pad-point")
        .data(launchpads)
        .enter()
        .append("circle")
        .attr("class", "pad-point")
        .attr("r", 5)
        .attr("data-id", d => d.id)
        .attr("transform", d => {
            const coords = projection([d.longitude, d.latitude]);
            return `translate(${coords[0]}, ${coords[1]})`;
        })
        .on("mouseover", function (event, d) {
            d3.selectAll(".pad-point").classed("highlight", false);
            d3.select(this).classed("highlight", true).raise();
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(d.name)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function () {
            d3.selectAll(".pad-point").classed("highlight", false);
            tooltip.transition().duration(200).style("opacity", 0);
        });
}
