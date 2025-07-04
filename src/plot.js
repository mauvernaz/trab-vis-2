import * as d3 from "d3";

export function plotBarChart(
  elementId,
  data,
  margens = { left: 50, right: 25, top: 25, bottom: 50 },
) {
  const svg = d3.select(`#${elementId}`);
  svg.selectAll("*").remove();

  const width =
    +svg.style("width").split("px")[0] - margens.left - margens.right;
  const height =
    +svg.style("height").split("px")[0] - margens.top - margens.bottom;

  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const x = d3
    .scaleBand()
    .domain(data.map((d) => dias[d.day_of_week]))
    .range([0, width])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.total_corridas)])
    .range([height, 0]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margens.left},${margens.top})`);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  // Escala de cor ordinal para as barras dos dias da semana
  const colorScale = d3
    .scaleOrdinal()
    .domain([0, 1, 2, 3, 4, 5, 6])
    .range([
      "#32AAD9",
      "#FF8001",
      "#FFC64E",
      "#5FD0DB",
      "#1A569C",
      "#435D74",
      "#FFFF00",
    ]);

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(dias[d.day_of_week]))
    .attr("y", (d) => y(d.total_corridas))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.total_corridas))
    .attr("fill", (d) => colorScale(d.day_of_week));

  g.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => x(dias[d.day_of_week]) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.total_corridas) - 5)
    .attr("text-anchor", "middle")
    .text((d) => d.total_corridas);

  setChartTitle("Total de Corridas por Dia da Semana");
}

export function plotLineChart(
  elementId,
  data,
  margens = { left: 50, right: 25, top: 25, bottom: 50 },
) {
  const svg = d3.select(`#${elementId}`);
  svg.selectAll("*").remove();

  const width =
    +svg.style("width").split("px")[0] - margens.left - margens.right;
  const height =
    +svg.style("height").split("px")[0] - margens.top - margens.bottom;

  const tipos = ["Dia Útil", "Fim de Semana"];
  const dataByTipo = tipos.map((tipo) => ({
    tipo,
    values: data
      .filter((d) => d.tipo_dia === tipo)
      .map((d) => ({
        hora: +d.hora,
        total_corridas: +d.total_corridas,
      })),
  }));

  const x = d3.scaleLinear().domain([0, 23]).range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.total_corridas)])
    .range([height, 0]);

  const color = d3.scaleOrdinal().domain(tipos).range(["#5ea6e0", "#f7b731"]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margens.left},${margens.top})`);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(24)
        .tickFormat((d) => `${d}h`),
    );

  g.append("g").call(d3.axisLeft(y));

  const line = d3
    .line()
    .x((d) => x(d.hora))
    .y((d) => y(d.total_corridas));

  dataByTipo.forEach((serie) => {
    g.append("path")
      .datum(serie.values)
      .attr("fill", "none")
      .attr("stroke", color(serie.tipo))
      .attr("stroke-width", 2.5)
      .attr("d", line);

    g.selectAll(`.dot-${serie.tipo.replace(/\s/g, "")}`)
      .data(serie.values)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.hora))
      .attr("cy", (d) => y(d.total_corridas))
      .attr("r", 3.5)
      .attr("fill", color(serie.tipo));
  });

  const legend = svg
    .append("g")
    .attr("transform", `translate(${margens.left + 20},${margens.top + 10})`);
  tipos.forEach((tipo, i) => {
    legend
      .append("circle")
      .attr("cx", 0)
      .attr("cy", i * 22)
      .attr("r", 7)
      .attr("fill", tipo === "Fim de Semana" ? "red" : color(tipo))
      .attr("class", tipo === "Fim de Semana" ? "legend-fds" : null);
    legend
      .append("text")
      .attr("x", 16)
      .attr("y", i * 22 + 5)
      .text(tipo)
      .attr("font-size", "1em")
      .attr("fill", "#3a4a5d");
  });

  setChartTitle("Corridas por Hora do Dia (Linha)");
}

export function plotBarChartPeriodos(
  elementId,
  data,
  periodosLabels,
  margens = { left: 50, right: 25, top: 25, bottom: 50 },
) {
  const svg = d3.select(`#${elementId}`);
  svg.selectAll("*").remove();

  const width =
    +svg.style("width").split("px")[0] - margens.left - margens.right;
  const height =
    +svg.style("height").split("px")[0] - margens.top - margens.bottom;

  const x = d3
    .scaleBand()
    .domain(periodosLabels)
    .range([0, width])
    .padding(0.1);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.media_gorjeta)])
    .range([height, 0]);
  const periodos = ["Madrugada", "Manhã", "Tarde", "Noite"];

  const g = svg
    .append("g")
    .attr("transform", `translate(${margens.left},${margens.top})`);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g").call(d3.axisLeft(y));

  // Gradiente de cor para as barras de períodos
  const colorScalePeriodo = d3
    .scaleLinear()
    .domain([0, data.length - 1])
    .range(["#32AAD9", "#FF8001"]);

  g.selectAll(".bar-periodo")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar-periodo")
    .attr("x", (d) => x(d.periodo))
    .attr("y", (d) => y(d.media_gorjeta))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.media_gorjeta))
    .attr("fill", (d, i) => colorScalePeriodo(i));

  g.selectAll(".label-periodo")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label-periodo")
    .attr("x", (d) => x(d.periodo) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.media_gorjeta) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "0.85em")
    .text((d) => d.media_gorjeta.toFixed(2));

  // Eixo X: mostrar o label completo do intervalo
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  setChartTitle("Média da Gorjeta por Faixa do Dia");
}

export function clearChart(elementId) {
  d3.select(`#${elementId}`).selectAll("*").remove();
  const htmlTitle = document.getElementById("chart-title");
  if (htmlTitle) htmlTitle.remove();
}

// Gráfico de Dispersão: Horário x Valor da Gorjeta
export function plotScatterplot(
  elementId,
  data,
  margens = { left: 50, right: 25, top: 25, bottom: 50 },
) {
  const svg = d3.select(`#${elementId}`);
  svg.selectAll("*").remove();

  const width =
    +svg.style("width").split("px")[0] - margens.left - margens.right;
  const height =
    +svg.style("height").split("px")[0] - margens.top - margens.bottom;

  const x = d3.scaleLinear().domain([0, 23]).range([0, width]);
  const tipExtent = d3.extent(data, (d) => +d.tip_amount);
  const y = d3.scaleLinear().domain(tipExtent).range([height, 0]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margens.left},${margens.top})`);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(24)
        .tickFormat((d) => `${d}h`),
    );

  g.append("g").call(d3.axisLeft(y));

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.hora_decimal))
    .attr("cy", (d) => y(+d.tip_amount))
    .attr("r", 3)
    .attr("fill", "#5ea6e0")
    .attr("opacity", 0.7);

  setChartTitle("Dispersão: Horário x Valor da Gorjeta");
}

function setChartTitle(title) {
  let htmlTitle = document.getElementById("chart-title");
  if (!htmlTitle) {
    htmlTitle = document.createElement("div");
    htmlTitle.id = "chart-title";
    htmlTitle.style.textAlign = "center";
    htmlTitle.style.fontSize = "20px";
    htmlTitle.style.fontWeight = "bold";
    htmlTitle.style.marginTop = "32px";
    htmlTitle.style.letterSpacing = "0.5px";
    htmlTitle.style.color = "#2a3a4d";
    document.body.insertBefore(
      htmlTitle,
      document.querySelector("svg").nextSibling,
    );
  }
  htmlTitle.textContent = title;
}
