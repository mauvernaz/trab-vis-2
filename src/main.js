import { Taxi } from "./taxi";
import {
  plotBarChart,
  plotLineChart,
  clearChart,
  plotScatterplot,
  plotBarChartPeriodos,
} from "./plot";

function setupButtons(taxi) {
  const barBtn = document.querySelector("#barChartBtn");
  const lineBtn = document.querySelector("#lineChartBtn");
  const scatterBtn = document.querySelector("#scatterBtn");
  const clearBtn = document.querySelector("#clearBtn");
  const periodSelect = document.getElementById("periodSelect");

  if (!barBtn || !lineBtn || !scatterBtn || !clearBtn || !periodSelect) return;

  // Função para buscar e plotar conforme o número de períodos
  async function plotPeriodos(num) {
    let sql, labels;
    if (num === 2) {
      sql = `
        SELECT
          CASE
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 6 AND 17 THEN 'Dia'
            ELSE 'Noite'
          END AS periodo,
          AVG(tip_amount) AS media_gorjeta
        FROM taxi_2023
        WHERE tip_amount IS NOT NULL
        GROUP BY periodo
        ORDER BY
          CASE
            WHEN periodo = 'Dia' THEN 0
            ELSE 1
          END
      `;
      labels = ["Dia", "Noite"];
    } else if (num === 3) {
      sql = `
        SELECT
          CASE
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 5 AND 11 THEN 'Manhã'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 12 AND 17 THEN 'Tarde'
            ELSE 'Noite'
          END AS periodo,
          AVG(tip_amount) AS media_gorjeta
        FROM taxi_2023
        WHERE tip_amount IS NOT NULL
        GROUP BY periodo
        ORDER BY
          CASE
            WHEN periodo = 'Manhã' THEN 0
            WHEN periodo = 'Tarde' THEN 1
            ELSE 2
          END
      `;
      labels = ["Manhã", "Tarde", "Noite"];
    } else if (num === 4) {
      sql = `
        SELECT
          CASE
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 5 AND 11 THEN 'Manhã'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 12 AND 17 THEN 'Tarde'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 18 AND 23 THEN 'Noite'
            ELSE 'Madrugada'
          END AS periodo,
          AVG(tip_amount) AS media_gorjeta
        FROM taxi_2023
        WHERE tip_amount IS NOT NULL
        GROUP BY periodo
        ORDER BY
          CASE
            WHEN periodo = 'Madrugada' THEN 0
            WHEN periodo = 'Manhã' THEN 1
            WHEN periodo = 'Tarde' THEN 2
            WHEN periodo = 'Noite' THEN 3
          END
      `;
      labels = ["Madrugada", "Manhã", "Tarde", "Noite"];
    } else if (num === 8) {
      sql = `
        SELECT
          CASE
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 0 AND 2 THEN '00-02'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 3 AND 5 THEN '03-05'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 6 AND 8 THEN '06-08'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 9 AND 11 THEN '09-11'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 12 AND 14 THEN '12-14'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 15 AND 17 THEN '15-17'
            WHEN EXTRACT('hour' FROM lpep_pickup_datetime) BETWEEN 18 AND 20 THEN '18-20'
            ELSE '21-23'
          END AS periodo,
          AVG(tip_amount) AS media_gorjeta
        FROM taxi_2023
        WHERE tip_amount IS NOT NULL
        GROUP BY periodo
        ORDER BY
          CASE
            WHEN periodo = '00-02' THEN 0
            WHEN periodo = '03-05' THEN 1
            WHEN periodo = '06-08' THEN 2
            WHEN periodo = '09-11' THEN 3
            WHEN periodo = '12-14' THEN 4
            WHEN periodo = '15-17' THEN 5
            WHEN periodo = '18-20' THEN 6
            ELSE 7
          END
      `;
      labels = [
        "00-02",
        "03-05",
        "06-08",
        "09-11",
        "12-14",
        "15-17",
        "18-20",
        "21-23",
      ];
    } else {
      return;
    }
    const data = (await taxi.query(sql)).map((d) => ({
      ...d,
      media_gorjeta: Number(d.media_gorjeta),
    }));
    plotBarChartPeriodos(data, labels);
  }

  // Inicializa o gráfico com o valor padrão do select
  plotPeriodos(Number(periodSelect.value));

  // Atualiza o gráfico ao mudar o select
  periodSelect.addEventListener("change", async (e) => {
    clearChart();
    await plotPeriodos(Number(periodSelect.value));
  });
  if (!barBtn || !lineBtn || !scatterBtn || !clearBtn) return;

  barBtn.addEventListener("click", async () => {
    clearChart();
    const sql = `
      SELECT
        EXTRACT('dow' FROM lpep_pickup_datetime) AS day_of_week,
        COUNT(*) AS total_corridas,
        AVG(trip_distance) AS media_distancia,
        AVG(total_amount) AS media_valor
      FROM taxi_2023
      GROUP BY day_of_week
      ORDER BY day_of_week
    `;
    const data = (await taxi.query(sql)).map((d) => ({
      ...d,
      day_of_week: Number(d.day_of_week),
      total_corridas: Number(d.total_corridas),
    }));
    plotBarChart(data);
  });

  lineBtn.addEventListener("click", async () => {
    clearChart();
    const sql = `
      SELECT
        EXTRACT('hour' FROM lpep_pickup_datetime) AS hora,
        CASE WHEN EXTRACT('dow' FROM lpep_pickup_datetime) IN (0,6) THEN 'Fim de Semana' ELSE 'Dia Útil' END AS tipo_dia,
        COUNT(*) AS total_corridas
      FROM taxi_2023
      GROUP BY hora, tipo_dia
      ORDER BY hora, tipo_dia
    `;
    const data = (await taxi.query(sql)).map((d) => ({
      ...d,
      hora: Number(d.hora),
      total_corridas: Number(d.total_corridas),
    }));
    plotLineChart(data);
  });

  clearBtn.addEventListener("click", () => {
    clearChart();
  });

  scatterBtn.addEventListener("click", async () => {
    clearChart();
    const sql = `
      SELECT
        (EXTRACT('hour' FROM lpep_pickup_datetime) + EXTRACT('minute' FROM lpep_pickup_datetime)/60.0) AS hora_decimal,
        tip_amount
      FROM taxi_2023
      WHERE tip_amount IS NOT NULL
      LIMIT 5000
    `;
    const data = (await taxi.query(sql)).map((d) => ({
      ...d,
      hora_decimal: Number(d.hora_decimal),
      tip_amount: Number(d.tip_amount),
    }));
    plotScatterplot(data);
  });

  // Esconder periodSwitcher ao trocar para outros gráficos
  barBtn.addEventListener("click", async () => {
    clearChart();
  });
  lineBtn.addEventListener("click", async () => {
    clearChart();
  });
  scatterBtn.addEventListener("click", async () => {
    clearChart();
  });
}

window.onload = async () => {
  const taxi = new Taxi();
  window.taxi = taxi;

  await taxi.init();
  await taxi.loadTaxi();

  setupButtons(taxi);
};
