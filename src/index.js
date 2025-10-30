import { SpaceX } from "./api/spacex.js";

document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const spaceX = new SpaceX();
  const loader = document.getElementById("loader");
  const map = document.getElementById("map");
  const launchList = document.getElementById("launchList");
  const error = document.getElementById("error");

  doOnLoading();

  try {
    console.log("🚀 Загружаем данные через класс SpaceX...");

    // ✅ Загружаем данные через твой класс
    const [launchpads, launches] = await Promise.all([
      spaceX.launchpads(),
      spaceX.launches()
    ]);

    console.log(`✅ Загружено ${launchpads.length} площадок и ${launches.length} запусков`);

    // ✅ Загружаем мир (осталось с URL, как раньше)
    console.log("🌍 Загружаем world.geojson...");
    const worldMap = await fetch("geo.json").then(r => r.json());

    console.log("✅ Мировая карта загружена!");

    doOnSuccess();

    // ✅ Отрисовка по старой логике
    drawMap(worldMap, launchpads, launches);

  } catch (err) {
    console.error("❌ Ошибка при загрузке:", err);
    doOnError(err);
  }
}

/* ========== СТАДИИ СОСТОЯНИЯ ========== */
function doOnLoading() {
  loader.style.display = "flex";
  map.style.display = "none";
  launchList.style.display = "none";
  console.log("Загрузка!");
}

function doOnSuccess() {
  loader.style.display = "none";
  map.style.display = "block";
  launchList.style.display = "block";
  console.log("✅ Успех!!!!!");
}

function doOnError(err) {
  loader.style.display = "none";
  const error = document.getElementById("error");
  error.textContent = "Ошибка загрузки данных: " + err.message;
}

/* ========== ОТРИСОВКА КАРТЫ ========== */
function drawMap(worldMap, launchpads, launches) {
  console.log("🌎 Отрисовка карты...");
  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  const g = svg.append("g");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const projection = d3.geoMercator()
    .scale(140)
    .translate([width / 2, height / 1.4]);

  drawWorldMap(projection, g, worldMap);
  drawLaunchpads(projection, g, launchpads);
  renderLaunchList(launches);

  // Зум, как в старой версии
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);
  console.log("✅ Карта отрисована.");
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

/* ========== СПИСОК ЗАПУСКОВ ========== */
function renderLaunchList(launches) {
  const list = d3.select("#launchList");
  list.selectAll("*").remove();

  launches.sort((a, b) => a.name.localeCompare(b.name));

  list.selectAll("li")
    .data(launches)
    .enter()
    .append("li")
    .text(d => d.name)
    .on("mouseover", (e, d) => {
      d3.selectAll(".pad-point").classed("highlight", false);
      d3.select(`.pad-point[data-id='${d.launchpad}']`)
        .classed("highlight", true)
        .raise();
    })
    .on("mouseout", () => {
      d3.selectAll(".pad-point").classed("highlight", false);
    });
}




