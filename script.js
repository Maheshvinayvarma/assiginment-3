function simulate(data, svg) {
  const width = parseInt(svg.attr("viewBox").split(" ")[2]);
  const height = parseInt(svg.attr("viewBox").split(" ")[3]);
  const mainGroup = svg.append("g").attr("transform", "translate(0, 50)");

  let nodeSelector = "0"; // Default node size option

  function updateNodeSize(option) {
    nodeSelector = option;
    updateNodeRadius();
  }

  d3.selectAll('input[name="nodeSelector"]').on("change", function () {
    updateNodeSize(this.value);
  });

  function updateNodeRadius() {
    nodeElements.selectAll("circle").attr("r", function (d) {
      let radius;
      if (nodeSelector === "0") {
        radius = scaleRadius(d.Authors.length);
      } else if (nodeSelector === "1") {
        radius = scaleRadius(nodeDegree[d.id]);
      } else if (nodeSelector === "2") {
        radius = scaleRadius(d.Citations / 8);
      } else {
        radius = scaleRadius(0);
      }
      return radius;
    });
  }

  let nodeDegree = {};
  d3.map(data.links, (d) => {
    updateNodeDegree(d.source);
    updateNodeDegree(d.target);
  });

  function updateNodeDegree(node) {
    if (node in nodeDegree) {
      nodeDegree[node]++;
    } else {
      nodeDegree[node] = 0;
    }
  }

  const scaleRadius = d3
    .scaleLinear()
    .domain(d3.extent(Object.values(nodeDegree)))
    .range([3, 12]);

  const color = d3
    .scaleSequential()
    .domain([1995, 2020])
    .interpolator(d3.interpolatePlasma);

  let collideInput = document.getElementById("collide");
  let chargeInput = document.getElementById("charge");
  let linkStrengthInput = document.getElementById("linkStrength");

  collideInput.addEventListener("input", updateCollideForce);
  chargeInput.addEventListener("input", updateChargeForce);
  linkStrengthInput.addEventListener("input", updateLinkStrength);

  let collideForce = d3.forceCollide().radius(0);
  let chargeForce = d3.forceManyBody().strength(-55);
  let linkForce = d3
    .forceLink(data.links)
    .id((d) => d.id)
    .strength(0.4);

  let forceSimulation = d3
    .forceSimulation(data.nodes)
    .force("collide", collideForce)
    .force("x", d3.forceX())
    .force("y", d3.forceY())
    .force("charge", chargeForce)
    .force("link", linkForce)
    .on("tick", ticked);

  function updateCollideForce() {
    let radius = parseInt(collideInput.value);
    collideForce.radius(radius);
    forceSimulation.alpha(0.5).restart();
  }

  function updateChargeForce() {
    let strength = parseInt(chargeInput.value);
    chargeForce.strength(strength);
    forceSimulation.alpha(0.5).restart();
  }

  function updateLinkStrength() {
    let strength = parseFloat(linkStrengthInput.value);
    linkForce.strength(strength);
    forceSimulation.alpha(0.5).restart();
  }

  let linkElements = mainGroup
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .attr("stroke", "#999")
    .attr("stroke-width", "3")
    .attr("stroke-opacity", 0.6)
    .selectAll(".line")
    .data(data.links)
    .enter()
    .append("line");

  const nodeElements = mainGroup
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .selectAll(".circle")
    .data(data.nodes)
    .enter()
    .append("g")
    .attr("r", (d) => d.Citations)
    .attr("fill", (d) => color(d.Year))
    .attr("class", function (d) {
      return "gr" + d.Country.replace(/\s+/g, "-").toLowerCase();
    })
    .on("click", function (d, data) {
      d3.selectAll("#paperTitle").text(` ${data.Title}`);
      d3.selectAll("#authorName").text(` ${data.Authors}`);
      d3.selectAll("#countryInfo").text(` ${data.Country}`);
      d3.selectAll("#yearInfo").text(` ${data.Year}`);
      nodeElements.classed("inactive", true);
      const selectedClass = d3.select(this).attr("class").split(" ")[0];
      d3.selectAll(".gr_" + selectedClass).classed("inactive", false);
    });

  nodeElements.append("circle").attr("r", function (d, i) {
    if (nodeDegree[d.id] !== undefined) {
      return scaleRadius(nodeDegree[d.id]);
    } else {
      return scaleRadius(0);
    }
  });

  function ticked() {
    nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
    linkElements
      .attr("x1", (d) => d.source.x)
      .attr("x2", (d) => d.target.x)
      .attr("y1", (d) => d.source.y)
      .attr("y2", (d) => d.target.y);
  }
  svg.call(
    d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([-1, 8])
      .on("zoom", zoomed)
  );
  function zoomed({ transform }) {
    mainGroup.attr("transform", transform);
  }

  // Call the updateNodeRadius function initially
  updateNodeRadius();
}
