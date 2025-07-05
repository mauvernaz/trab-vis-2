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

    // Projeção para uso no brush
    const svg = d3.select("#map-chart svg");
    const margens = { left: 20, right: 20, top: 20, bottom: 20 };
    const width = +svg.style("width").split("px")[0] - margens.left - margens.right;
    const height = +svg.style("height").split("px")[0] - margens.top - margens.bottom;
    const projection = d3.geoMercator().fitSize([width, height], geoData);

    // Função de interatividade do brush
    function handleBrush(event, geoData, projection, fullDataset) {
      if (!event.selection) {
        // Sem seleção: redesenha com dados completos
        // Gráfico de Linhas
        const lineData = d3.rollups(
          fullDataset,
          v => v.length,
          d => d.hora = new Date(d.lpep_pickup_datetime).getHours(),
          d => (new Date(d.lpep_pickup_datetime).getDay() === 0 || new Date(d.lpep_pickup_datetime).getDay() === 6) ? "Fim de Semana" : "Dia Útil"
        ).flatMap(([hora, tipos]) => tipos.map(([tipo_dia, total_corridas]) => ({ hora, tipo_dia, total_corridas })));
        plotLineChart("line-chart svg", lineData);

        // Gráfico de Barras
        const barData = d3.rollups(
          fullDataset,
          v => d3.mean(v, d => +d.total_amount),
          d => d.passenger_count
        ).map(([passenger_count, media_valor]) => ({ passenger_count, media_valor }));
        plotBarChart("bar-chart svg", barData);

        // Gráfico de Dispersão
        const scatterData = fullDataset.map(d => ({ trip_distance: +d.trip_distance, tip_amount: +d.tip_amount })).filter(d => !isNaN(d.trip_distance) && !isNaN(d.tip_amount));
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
      const lineData = d3.rollups(
        dadosFiltrados,
        v => v.length,
        d => d.hora = new Date(d.lpep_pickup_datetime).getHours(),
        d => (new Date(d.lpep_pickup_datetime).getDay() === 0 || new Date(d.lpep_pickup_datetime).getDay() === 6) ? "Fim de Semana" : "Dia Útil"
      ).flatMap(([hora, tipos]) => tipos.map(([tipo_dia, total_corridas]) => ({ hora, tipo_dia, total_corridas })));
      plotLineChart("line-chart svg", lineData);
      // Gráfico de Barras
      const barData = d3.rollups(
        dadosFiltrados,
        v => d3.mean(v, d => +d.total_amount),
        d => d.passenger_count
      ).map(([passenger_count, media_valor]) => ({ passenger_count, media_valor }));
      plotBarChart("bar-chart svg", barData);
      // Gráfico de Dispersão
      const scatterData = dadosFiltrados.map(d => ({ trip_distance: +d.trip_distance, tip_amount: +d.tip_amount })).filter(d => !isNaN(d.trip_distance) && !isNaN(d.tip_amount));
      plotScatterplot("scatter-plot svg", scatterData);
    }

    // Renderizar o mapa coroplético com interatividade
    drawMap(
      "map-chart svg",
      geoData,
      taxiMapData,
      (event) => handleBrush(event, geoData, projection, fullDataset)
    );

    // Renderização inicial dos gráficos com o fullDataset
    // Gráfico de Linhas
    const lineData = d3.rollups(
      fullDataset,
      v => v.length,
      d => d.hora = new Date(d.lpep_pickup_datetime).getHours(),
      d => (new Date(d.lpep_pickup_datetime).getDay() === 0 || new Date(d.lpep_pickup_datetime).getDay() === 6) ? "Fim de Semana" : "Dia Útil"
    ).flatMap(([hora, tipos]) => tipos.map(([tipo_dia, total_corridas]) => ({ hora, tipo_dia, total_corridas })));
    plotLineChart("line-chart svg", lineData);
    // Gráfico de Barras
    const barData = d3.rollups(
      fullDataset,
      v => d3.mean(v, d => +d.total_amount),
      d => d.passenger_count
    ).map(([passenger_count, media_valor]) => ({ passenger_count, media_valor }));
    plotBarChart("bar-chart svg", barData);
    // Gráfico de Dispersão
    const scatterData = fullDataset.map(d => ({ trip_distance: +d.trip_distance, tip_amount: +d.tip_amount })).filter(d => !isNaN(d.trip_distance) && !isNaN(d.tip_amount));
    plotScatterplot("scatter-plot svg", scatterData);
  } catch (error) {
    console.error(error);
  }
}

main();
