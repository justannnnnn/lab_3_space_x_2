import { SpaceX } from "./api/spacex.js";

document.addEventListener("DOMContentLoaded", setup);

async function setup() {
  const spaceX = new SpaceX();
  const loader = document.getElementById("loader");
  const error = document.getElementById("error");

  console.log("🚀 Инициализация приложения SpaceX Stats...");

  try {
    loader.style.display = "flex";
    error.textContent = "";

    console.log("📡 Загружаем площадки (launchpads)...");
    const launchpads = await spaceX.launchpads();
    console.log(`✅ Загружено площадок: ${launchpads.length}`);

    console.log("🛰️ Загружаем запуски (launches)...");
    const launches = await spaceX.launches();
    console.log(`✅ Загружено запусков: ${launches.length}`);

    console.log("🌍 Загружаем geo.json (мировая карта)...");
    const worldMap = await fetch("geo.json").then(r => r.json());
    console.log("✅ Мировая карта загружена успешно!");

    console.log("🧩 Рендерим список запусков...");
    renderLaunches(launches, launchpads);
    console.log("✅ Список запусков отрисован.");

    console.log("🗺️ Рисуем карту...");
    drawMap(worldMap, launchpads, launches);
    console.log("✅ Карта отрисована.");

    // Скрываем лоадер
    loader.style.display = "none";
    console.log("🎉 Загрузка завершена, лоадер скрыт!");
  } catch (err) {
    console.error("❌ Ошибка загрузки данных:", err);
    loader.style.display = "none";
    error.textContent = "Не удалось загрузить данные 😞";
  }
}

/* ========== СПИСОК ЗАПУСКОВ ========== */
function renderLaunches(launches, launchpads) {
  console.log("📋 Начинаем отрисовку списка запусков...");
  const list = d3.select("#launchList");
  list.selectAll("li").remove();

  launches.sort((a, b) => a.name.localeCompare(b.name));

  list.selectAll("li")
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
        console.log(`✨ Подсвечена площадка: ${pad.name}`);
      }
    })
    .on("mouseout", () => {
      d3.selectAll(".pad-point").classed("highlight", false);
    });

  console.log("📋 Список запусков успешно отрисован!");
}

/* ========== КАРТА ========== */
function drawMap(worldMap, launchpads) {
  console.log("🌎 Начинаем рисовать карту...");
  const svg = d3.select("#map");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const g = svg.append("g");
  const projection = d3.geoMercator()
    .scale(140)
    .translate([width / 2, height / 1.4]);

  drawWorldMap(projection, g, worldMap);
  drawLaunchpads(projection, g, launchpads);
  console.log("🌎 Карта успешно отрисована!");
}

/* ========== МИРОВАЯ КАРТА ========== */
function drawWorldMap(projection, g, worldMap) {
  console.log("🗺️ Отрисовываем мир из geo.json...");
  const geoPath = d3.geoPath().projection(projection);

  g.selectAll("path")
    .data(worldMap.features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("fill", "#ddd")
    .attr("stroke", "#999");

  console.log("🗺️ Мировая карта готова!");
}

/* ========== ТОЧКИ ЗАПУСКОВ ========== */
function drawLaunchpads(projection, g, launchpads) {
  console.log(`📍 Отрисовываем ${launchpads.length} площадок...`);
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
      console.log(`🛰️ Наведение на площадку: ${d.name}`);
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

  console.log("📍 Все площадки успешно отрисованы!");
}



