import React, { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const D3Graph = ({
  data,
  loading,
  selectedNode,
  setSelectedNode,
  searchTerm,
  width = "100%",
  height = "100%",
}) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef(null);
  const linksRef = useRef(null);
  const labelsRef = useRef(null);
  const particlesRef = useRef(null);

  // Particle animation configuration
  const PARTICLE_RADIUS = 3;
  const PARTICLE_DURATION = 2000; // Duration in milliseconds

  const createParticleData = useCallback((edge) => {
    return {
      source: edge.source,
      target: edge.target,
      startTime: Date.now(),
      metric1: edge.metric1,
      metric2: edge.metric2,
    };
  }, []);

  const updateParticles = useCallback(() => {
    if (!selectedNode || !particlesRef.current) return;

    const relevantEdges = data.edges.filter(
      (edge) =>
        edge.source.id === selectedNode.id || edge.target.id === selectedNode.id
    );

    // Create new particles
    relevantEdges.forEach((edge) => {
      if (Math.random() < 0.1) {
        // Control particle generation rate
        const particle = createParticleData(edge);
        const particleElement = particlesRef.current
          .append("circle")
          .attr("r", PARTICLE_RADIUS)
          .attr(
            "fill",
            edge.source.id === selectedNode.id ? "#40c4ff" : "#ff9f40"
          )
          .attr("opacity", 0.7);

        // Animate particle along the path
        const startX = edge.source.x;
        const startY = edge.source.y;
        const endX = edge.target.x;
        const endY = edge.target.y;

        particleElement
          .attr("cx", startX)
          .attr("cy", startY)
          .transition()
          .duration(PARTICLE_DURATION)
          .ease(d3.easeLinear)
          .attr("cx", endX)
          .attr("cy", endY)
          .on("end", function () {
            d3.select(this).remove();
          });
      }
    });
  }, [selectedNode, data.edges, createParticleData]);

  const drag = useCallback(() => {
    function dragstarted(event) {
      if (!event.active && simulationRef.current) {
        simulationRef.current.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active && simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }, []);

  // Initialize D3 visualization
  useEffect(() => {
    if (!svgRef.current || loading || !data.nodes.length) return;

    const width = svgRef.current.parentElement.clientWidth;
    const height = svgRef.current.parentElement.clientHeight;

    // Only set up the SVG and simulation once
    if (!simulationRef.current) {
      d3.select(svgRef.current).selectAll("*").remove();

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      const zoom = d3
        .zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      const g = svg.append("g");

      // Create groups for links, nodes, labels, and particles
      linksRef.current = g.append("g").selectAll("line");
      particlesRef.current = g.append("g"); // Container for particles
      nodesRef.current = g.append("g").selectAll("circle");
      labelsRef.current = g.append("g").selectAll("text");

      // Initialize simulation
      simulationRef.current = d3
        .forceSimulation()
        .force(
          "link",
          d3
            .forceLink()
            .id((d) => d.id)
            .distance(100)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collision",
          d3.forceCollide().radius((d) => d.radius + 5)
        );
    }

    // Update the simulation with new data
    const simulation = simulationRef.current;

    // Update links with gradients for data flow
    linksRef.current = linksRef.current
      .data(data.edges)
      .join("line")
      .attr("stroke", (d) => {
        if (selectedNode) {
          if (d.source.id === selectedNode.id) return "rgba(64, 196, 255, 0.4)";
          if (d.target.id === selectedNode.id) return "rgba(255, 159, 64, 0.4)";
        }
        return "rgba(255,255,255,0.2)";
      })
      .attr("stroke-width", (d) => Math.sqrt(d.weight))
      .attr("marker-end", "url(#arrowhead)");

    // Update nodes
    nodesRef.current = nodesRef.current
      .data(data.nodes)
      .join("circle")
      .style("cursor", "pointer")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        if (selectedNode?.id === d.id) return "rgba(64, 196, 255, 0.8)";
        if (
          searchTerm &&
          d.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return "rgba(255, 159, 64, 0.8)";
        }
        return "rgba(98, 114, 164, 0.6)";
      })
      .attr("stroke", "rgba(255,255,255,0.8)")
      .attr("stroke-width", 2)
      .on("click", (event, d) => {
        setSelectedNode(selectedNode?.id === d.id ? null : d);
        event.stopPropagation();
      })
      .call(drag());

    // Update labels
    labelsRef.current = labelsRef.current
      .data(data.nodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", "10px")
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("dy", 20);

    // Update simulation
    simulation.nodes(data.nodes);
    simulation.force("link").links(data.edges);

    // Initialize positions if needed
    data.nodes.forEach((node) => {
      if (typeof node.x === "undefined" || typeof node.y === "undefined") {
        node.x = width / 2 + (Math.random() - 0.5) * 100;
        node.y = height / 2 + (Math.random() - 0.5) * 100;
      }
    });

    // Update positions on tick
    simulation.on("tick", () => {
      linksRef.current
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodesRef.current.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      labelsRef.current.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Start particle animation loop
    const animationInterval = setInterval(updateParticles, 100);

    // Cleanup
    return () => {
      if (simulation) {
        simulation.on("tick", null);
      }
      clearInterval(animationInterval);
    };
  }, [
    data,
    selectedNode,
    searchTerm,
    loading,
    drag,
    setSelectedNode,
    updateParticles,
  ]);

  return (
    <div className="w-100 h-100">
      {loading ? (
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border text-info" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <svg ref={svgRef} className="w-100 h-100" />
      )}
    </div>
  );
};

export default D3Graph;
