import { SpaceX } from "./api/spacex.js";

document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const spaceX = new SpaceX();

  try {
    const loader = document.getElementById("loader");
    const error = document.getElementById("error");

    // Показываем лоадер
    loader.style.display = "flex";
    error.textContent = "";

    // Загружаем данные
    const launchpads = await spaceX.launchpads();
    const launches = await spaceX.launches();
    const worldMap = await fetch("geo.json").then(r => r.json());

    // Рендерим
    renderLaunches(launches, launchpads);
    drawMap(worldMap, launchpads, launches);

    // ✅ Скрываем лоадер после успешной загрузки
    loader.style.display = "none";
  } catch (err) {
    console.error("Ошибка загрузки:", err);

    // Прячем лоадер и показываем сообщение об ошибке
    document.getElementById("loader").style.display = "none";
    document.getElementById("error").textContent = "Не удалось загрузить данные 😞";
  }
}

/* ========== СПИСОК ЗАПУСКОВ ========== */
function renderLaunches(launches, launchpads) {
  const list = d3.select("#launchList");
  list.selectAll("li").remove(); // очистим

  launches.sort((a, b) => a.name.localeCompare(b.name));

  const items = list.selectAll("li")
    .data(launches)
    .enter()
    .append("li")
    .text(d => d.name)
    .on("mouseover", (event, d) => {
      d3.selectAll(".pad-point").classed("highlight", false);
      const pad = launchpads.find(p => p.id === d.launchpad);
      if (pad) {
        d3.selectAll(".pad-point")
          .filter(p => p.id === pad.id)
          .classed("highlight", true)
          .raise();
      }
    })
    .on("mouseout", () => {
      d3.selectAll(".pad-point").classed("highlight", false);
    });
}

/* ========== КАРТА ========== */
function drawMap(worldMap, launchpads) {
  const svg = d3.select("#map");
  svg.selectAll("*").remove(); // очистим карту перед рисованием

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const g = svg.append("g");
  const projection = d3.geoMercator()
    .scale(140)
    .translate([width / 2, height / 1.4]);

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


