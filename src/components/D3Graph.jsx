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

  // Memoize drag function with simulation passed as parameter
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

    // Stop any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const width = svgRef.current.parentElement.clientWidth;
    const height = svgRef.current.parentElement.clientHeight;

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

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-10 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M-10,-5L0,0L-10,5")
      .attr("fill", "rgba(255,255,255,0.4)");

    const links = g
      .append("g")
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", (d) => Math.sqrt(d.weight))
      .attr("marker-end", "url(#arrowhead)");

    const nodes = g
      .append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
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
      });

    const labels = g
      .append("g")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", "10px")
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("dy", 20);

    // Create and store the simulation
    simulationRef.current = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => d.radius + 5)
      )
      .on("tick", () => {
        links
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

        labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
      });

    // Apply drag behavior to nodes
    nodes.call(drag());

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [data, selectedNode, searchTerm, loading, drag, setSelectedNode]);

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
