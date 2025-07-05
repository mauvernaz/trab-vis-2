import * as d3 from "d3";

export function plotBarChart(
  elementId,
  data,
  margens = { left: 50, right: 25, top: 25, bottom: 50 },
) {
  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const svg = d3.select(`#${elementId}`);
  svg.selectAll("*").remove();

  const width =
    +svg.style("width").split("px")[0] - margens.left - margens.right;
  const height =
    +svg.style("height").split("px")[0] - margens.top - margens.bottom;

  // Eixo X fixo para os dias da semana
  const x = d3
    .scaleBand()
    .domain(diasDaSemana)
    .range([0, width])
    .padding(0.2);

  // Escala Y baseada em total_corridas
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

  g.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(diasDaSemana[d.dia_semana]))
    .attr("y", (d) => y(d.total_corridas))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.total_corridas))
    .attr("fill", "#5ea6e0");

  g.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => x(diasDaSemana[d.dia_semana]) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.total_corridas) - 5)
    .attr("text-anchor", "middle")
    .text((d) => d.total_corridas);
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

  // Escala X fixa de 0 a 23 (hora)
  const x = d3
    .scaleLinear()
    .domain([0, 23])
    .range([0, width]);
  const tipExtent = d3.extent(data, (d) => +d.tip_amount);
  const y = d3.scaleLinear().domain(tipExtent).range([height, 0]);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margens.left},${margens.top})`);

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(24).tickFormat(d => `${d}h`));

  g.append("g").call(d3.axisLeft(y));

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.hora))
    .attr("cy", (d) => y(+d.tip_amount))
    .attr("r", 3)
    .attr("fill", "#5ea6e0")
    .attr("opacity", 0.7);
}

// Novo: Função para desenhar o mapa com pontos de corrida e brush
export function drawMap(elementId, geoData, taxiData, brushCallback) {
  const svg = d3.select(`#${elementId}`);
  svg.selectAll("*").remove();

  const margens = { left: 20, right: 20, top: 20, bottom: 20 };
  const width = +svg.style("width").split("px")[0] - margens.left - margens.right;
  const height = +svg.style("height").split("px")[0] - margens.top - margens.bottom;

  // Projeção geográfica
  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath(projection);

  // Map de corridas por zona
  const corridasPorZona = new Map(taxiData.map(d => [Number(d.PULocationID), Number(d.total_corridas)]));
  const maxCorridas = d3.max(corridasPorZona.values());

  const colorScale = d3.scaleLinear()
    .domain([0, maxCorridas * 0.2, maxCorridas * 0.4, maxCorridas * 0.6, maxCorridas * 0.8, maxCorridas])
    .range(["#ADD8E6", "#90EE90", "#FFFFE0", "#FFA500", "#FF4500", "#8B0000"]);

  // Grupo principal
  const g = svg.append("g").attr("transform", `translate(${margens.left},${margens.top})`);

  // Brush deve ser adicionado primeiro!
  const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("end", brushCallback);
  g.append("g").attr("class", "brush").call(brush);

  // Polígonos do mapa (coroplético)
  const paths = g.selectAll("path")
    .data(geoData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", d => {
      const id = Number(d.properties.location_id);
      const total = corridasPorZona.get(id);
      return total ? colorScale(total) : "#f0f0f0";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("stroke", "black").attr("stroke-width", 2).raise();
      const zoneName = d.properties.zone;
      const id = Number(d.properties.location_id);
      const total = corridasPorZona.get(id);
      g.select("#info-zone-name").text(zoneName);
      g.select("#info-ride-count").text(`Total de Corridas: ${total || 0}`);
    })
    .on("mouseout", function(event, d) {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
      g.select("#info-zone-name").text("");
      g.select("#info-ride-count").text("");
    });

  // --- LEGENDA DE GRADIENTE DE CORES ---
  // Parâmetros da legenda
  const legendWidth = 20;
  const legendHeight = 200;
  const legendMargin = 20;
  const legendX = width - legendWidth - legendMargin;
  const legendY = legendMargin;
  const legendDomain = [0, maxCorridas * 0.2, maxCorridas * 0.4, maxCorridas * 0.6, maxCorridas * 0.8, maxCorridas];
  const legendRange = ["#ADD8E6", "#90EE90", "#FFFFE0", "#FFA500", "#FF4500", "#8B0000"];

  // Definição do gradiente
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  legendDomain.forEach((d, i) => {
    linearGradient.append("stop")
      .attr("offset", `${(i / (legendDomain.length - 1)) * 100}%`)
      .attr("stop-color", legendRange[i]);
  });

  // Grupo da legenda
  const legendG = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX + margens.left},${legendY + margens.top})`);

  // Retângulo da barra de cor
  legendG.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Título da legenda
  legendG.append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-weight", "bold")
    .text("Total de Corridas");

  // --- INFOBOX DE HOVER ---
  // Caixa de informações na parte inferior do mapa
  const infoBox = g.append("g")
    .attr("transform", `translate(10, ${height - 40})`);
  infoBox.append("text")
    .attr("id", "info-zone-name")
    .attr("y", 0)
    .attr("font-size", "1.1em")
    .attr("font-weight", "bold")
    .attr("fill", "#2a4d69")
    .text("");
  infoBox.append("text")
    .attr("id", "info-ride-count")
    .attr("y", 20)
    .attr("font-size", "1em")
    .attr("fill", "#3a4a5d")
    .text("");
}
