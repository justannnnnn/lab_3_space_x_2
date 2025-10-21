import { SpaceX } from "./api/spacex.js";
import * as d3 from "d3";
import * as Geo from "./geo.json";

document.addEventListener("DOMContentLoaded", setup);

function setup() {
    const spaceX = new SpaceX();

    // Загружаем данные без Promise.all
    spaceX.launchpads().then(launchpads => {
        spaceX.launches().then(launches => {
            renderLaunches(launches, launchpads);
            drawMap(Geo, launchpads, launches);
        });
    });
}

/* ========== СПИСОК ЗАПУСКОВ ========== */
function renderLaunches(launches, launchpads) {
    const container = document.getElementById("listContainer");
    const list = document.createElement("ul");

    launches.sort((a, b) => a.name.localeCompare(b.name));

    launches.forEach(launch => {
        const item = document.createElement("li");
        item.textContent = launch.name;

        // Подсветка launchpad при наведении на запуск
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

/* ========== КАРТА ========== */
function drawMap(worldMap, launchpads) {
    const width = 900;
    const height = 500;

    const svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g");
    const projection = d3.geoMercator()
        .scale(140)
        .translate([width / 2, height / 1.4]);

    // Отрисовка мира из локального Geo
    drawWorldMap(projection, g, worldMap);
    drawLaunchpads(projection, g, launchpads);
}

/* ========== МИРОВАЯ КАРТА ========== */
function drawWorldMap(projection, g, worldMap) {
    const geoPath = d3.geoPath().projection(projection);

    g.selectAll("path")
        .data(worldMap.features)
        .enter()
        .append("path")
        .attr("d", geoPath)
        .attr("fill", "#ddd")
        .attr("stroke", "#999");
}

/* ========== ТОЧКИ ЗАПУСКОВ ========== */
function drawLaunchpads(projection, g, launchpads) {
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

