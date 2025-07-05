import { Taxi } from "./taxi.js";
import { plotLineChart, plotBarChart, plotScatterplot, drawMap } from "./plot.js";
import * as d3 from "d3";

async function main() {
  try {
    const taxi = new Taxi();
    await taxi.init();
    await taxi.loadTaxi();

    // Carregar dados geográficos e agregados de corridas por zona
    const [geoData, taxiMapData] = await Promise.all([
      d3.json("data/nyc_taxi_zones.json"),
      taxi.query(`SELECT PULocationID, COUNT(*) as total_corridas FROM taxi_2023 GROUP BY PULocationID`)
    ]);

    // Renderizar o mapa coroplético
    drawMap(
      "map-chart svg",
      geoData,
      taxiMapData,
      (event) => console.log("Seleção do Brush:", event.selection)
    );

    // Gráfico de Linhas: Corridas por hora e tipo de dia
    const lineSql = `
      SELECT
        EXTRACT('hour' FROM lpep_pickup_datetime) AS hora,
        CASE WHEN EXTRACT('dow' FROM lpep_pickup_datetime) IN (0,6) THEN 'Fim de Semana' ELSE 'Dia Útil' END AS tipo_dia,
        COUNT(*) AS total_corridas
      FROM taxi_2023
      GROUP BY hora, tipo_dia
      ORDER BY hora, tipo_dia
    `;
    const lineData = (await taxi.query(lineSql)).map((d) => ({
      ...d,
      hora: Number(d.hora),
      total_corridas: Number(d.total_corridas),
    }));
    plotLineChart("line-chart svg", lineData);

    // Gráfico de Barras: Média do valor total por quantidade de passageiros
    const barSql = `
      SELECT
        passenger_count,
        AVG(total_amount) AS media_valor
      FROM taxi_2023
      WHERE passenger_count IS NOT NULL
      GROUP BY passenger_count
      ORDER BY passenger_count
    `;
    const barData = (await taxi.query(barSql)).map((d) => ({
      ...d,
      passenger_count: Number(d.passenger_count),
      media_valor: Number(d.media_valor),
    }));
    plotBarChart("bar-chart svg", barData);

    // Gráfico de Dispersão: trip_distance vs tip_amount
    const scatterSql = `
      SELECT
        trip_distance,
        tip_amount
      FROM taxi_2023
      WHERE tip_amount IS NOT NULL AND trip_distance IS NOT NULL
      LIMIT 5000
    `;
    const scatterData = (await taxi.query(scatterSql)).map((d) => ({
      ...d,
      trip_distance: Number(d.trip_distance),
      tip_amount: Number(d.tip_amount),
    }));
    plotScatterplot("scatter-plot svg", scatterData);
  } catch (error) {
    console.error(error);
  }
}

main();
