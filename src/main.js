import { Taxi } from "./taxi.js";
import { plotLineChart, plotBarChart, plotScatterplot, drawMap } from "./plot.js";
import * as d3 from "d3";

async function main() {
  try {
    const taxi = new Taxi();
    await taxi.init();
    await taxi.loadTaxi();

    // Carregar dados completos para filtragem
    const fullDataset = await taxi.query(`
      SELECT 
        lpep_pickup_datetime, 
        passenger_count, 
        total_amount, 
        trip_distance, 
        tip_amount, 
        PULocationID 
      FROM taxi_2023 
      WHERE PULocationID IS NOT NULL 
      LIMIT 50000
    `);

    // Carregar dados geográficos e agregados de corridas por zona
    const [geoData, taxiMapData] = await Promise.all([
      d3.json("data/nyc_taxi_zones.json"),
      taxi.query(`SELECT PULocationID, COUNT(*) as total_corridas FROM taxi_2023 GROUP BY PULocationID`)
    ]);

    // Filtrar apenas Manhattan
    const manhattanFeatures = geoData.features.filter(f => f.properties.borough === "Manhattan");
    const manhattanGeoData = {
      type: "FeatureCollection",
      features: manhattanFeatures
    };

    // Projeção para uso no brush
    const svg = d3.select("#map-chart svg");
    const margens = { left: 20, right: 20, top: 20, bottom: 20 };
    const width = +svg.style("width").split("px")[0] - margens.left - margens.right;
    const height = +svg.style("height").split("px")[0] - margens.top - margens.bottom;
    const projection = d3.geoMercator().fitSize([width, height], manhattanGeoData);

    // Dados iniciais para reset
    const lineData = d3.rollups(
      fullDataset,
      v => v.length,
      d => d.hora = new Date(d.lpep_pickup_datetime).getHours(),
      d => (new Date(d.lpep_pickup_datetime).getDay() === 0 || new Date(d.lpep_pickup_datetime).getDay() === 6) ? "Fim de Semana" : "Dia Útil"
    )
    .flatMap(([hora, tipos]) => tipos.map(([tipo_dia, total_corridas]) => ({ hora, tipo_dia, total_corridas })))
    .sort((a, b) => a.hora - b.hora);

    const barSql = `
      SELECT EXTRACT('dow' FROM lpep_pickup_datetime) AS dia_semana, COUNT(*) as total_corridas 
      FROM taxi_2023 
      GROUP BY dia_semana 
      ORDER BY dia_semana
    `;
    const barData = await taxi.query(barSql);
    const barDataProcessed = barData.map(d => ({
      dia_semana: Number(d.dia_semana),
      total_corridas: Number(d.total_corridas)
    }));

    const scatterData = fullDataset
      .map(d => {
        const date = new Date(d.lpep_pickup_datetime);
        const hora = date.getHours() + (date.getMinutes() / 60);
        return { hora, tip_amount: +d.tip_amount };
      })
      .filter(d => !isNaN(d.hora) && !isNaN(d.tip_amount));

    // Função de interatividade do brush
    async function handleBrush(event, geoData, projection, fullDataset) {
      if (!event.selection) {
        console.log("Resetando gráficos para a visão completa...");
        plotLineChart("line-chart svg", lineData);
        plotBarChart("bar-chart svg", barDataProcessed);
        plotScatterplot("scatter-plot svg", scatterData);
        return;
      }
      const [[x0, y0], [x1, y1]] = event.selection;
      // Encontrar zonas selecionadas
      const zonasSelecionadas = geoData.features.filter(f => {
        const [cx, cy] = projection(d3.geoCentroid(f));
        return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
      }).map(f => Number(f.properties.location_id));
      // Filtrar dados
      const dadosFiltrados = fullDataset.filter(d => zonasSelecionadas.includes(Number(d.PULocationID)));
      // Gráfico de Linhas
      const lineDataFiltrado = d3.rollups(
        dadosFiltrados,
        v => v.length,
        d => d.hora = new Date(d.lpep_pickup_datetime).getHours(),
        d => (new Date(d.lpep_pickup_datetime).getDay() === 0 || new Date(d.lpep_pickup_datetime).getDay() === 6) ? "Fim de Semana" : "Dia Útil"
      )
      .flatMap(([hora, tipos]) => tipos.map(([tipo_dia, total_corridas]) => ({ hora, tipo_dia, total_corridas })))
      .sort((a, b) => a.hora - b.hora);
      plotLineChart("line-chart svg", lineDataFiltrado);
      // Gráfico de Barras: total de corridas por dia da semana (filtrado)
      const barDataFiltrado = Array.from(d3.rollups(
        dadosFiltrados,
        v => v.length,
        d => new Date(d.lpep_pickup_datetime).getDay()
      ), ([dia_semana, total_corridas]) => ({ dia_semana, total_corridas }))
      .sort((a, b) => a.dia_semana - b.dia_semana);
      plotBarChart("bar-chart svg", barDataFiltrado);
      // Gráfico de Dispersão
      const scatterDataFiltrado = dadosFiltrados
        .map(d => {
          const date = new Date(d.lpep_pickup_datetime);
          const hora = date.getHours() + (date.getMinutes() / 60);
          return { hora, tip_amount: +d.tip_amount };
        })
        .filter(d => !isNaN(d.hora) && !isNaN(d.tip_amount));
      plotScatterplot("scatter-plot svg", scatterDataFiltrado);
    }

    // Renderizar o mapa coroplético com interatividade
    drawMap(
      "map-chart svg",
      manhattanGeoData,
      taxiMapData,
      (event) => handleBrush(event, manhattanGeoData, projection, fullDataset)
    );

    // Renderização inicial dos gráficos com o fullDataset
    plotLineChart("line-chart svg", lineData);
    plotBarChart("bar-chart svg", barDataProcessed);
    plotScatterplot("scatter-plot svg", scatterData);
  } catch (error) {
    console.error(error);
  }
}

main();
