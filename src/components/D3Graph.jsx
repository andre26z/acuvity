import React, { useEffect, useRef } from "react";
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
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

      const zoom = d3
        .zoom()
        .scaleExtent([0.5, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      const g = svg.append("g");

      // Create groups for links, nodes, and labels
      linksRef.current = g.append("g").selectAll("line");
      nodesRef.current = g.append("g").selectAll("circle");
      labelsRef.current = g.append("g").selectAll("text");

      simulationRef.current = d3
        .forceSimulation()
        .force(
          "link",
          d3
            .forceLink()
            .id((d) => d.id)
            .distance(100)
        )
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));
    }

    const simulation = simulationRef.current;

    // Create all links but only show the ones connected to the selected node
    const allLinks = data.edges.map((d) => ({
      source:
        typeof d.source === "string"
          ? data.nodes.find((n) => n.id === d.source)
          : d.source,
      target:
        typeof d.target === "string"
          ? data.nodes.find((n) => n.id === d.target)
          : d.target,
      ...d,
    }));

    // Calculate node radius (used for arrow positioning)
    const getNodeRadius = (d) => d.radius || 5;

    // Update links
    linksRef.current = linksRef.current
      .data(allLinks)
      .join("line")
      .attr("stroke", (d) => {
        const sourceId = d.source.id || d.source;
        const targetId = d.target.id || d.target;
        if (!selectedNode) return "rgba(255,255,255,0)"; // Hide when no node selected
        if (sourceId !== selectedNode.id && targetId !== selectedNode.id) {
          return "rgba(255,255,255,0)"; // Hide unconnected links
        }
        return sourceId === selectedNode.id
          ? "rgba(64, 196, 255, 0.4)" // Outgoing
          : "rgba(255, 159, 64, 0.4)"; // Incoming
      })
      .attr("stroke-width", (d) => Math.sqrt(d.weight || 1))
      .attr("marker-end", (d) => {
        const sourceId = d.source.id || d.source;
        if (
          !selectedNode ||
          (sourceId !== selectedNode.id && d.target.id !== selectedNode.id)
        ) {
          return null; // Hide arrows for unconnected links
        }
        return sourceId === selectedNode.id
          ? "url(#arrowOut)"
          : "url(#arrowIn)";
      });

    // Update nodes
    nodesRef.current = nodesRef.current
      .data(data.nodes)
      .join("circle")
      .style("cursor", "pointer")
      .attr("r", getNodeRadius)
      .attr("fill", (d) => {
        if (selectedNode) {
          if (selectedNode.id === d.id) return "rgba(64, 196, 255, 0.8)";
          // Check if node is connected to selected node
          const isConnected = allLinks.some(
            (link) =>
              (link.source.id === selectedNode.id && link.target.id === d.id) ||
              (link.target.id === selectedNode.id && link.source.id === d.id)
          );
          if (isConnected) {
            return allLinks.some(
              (link) =>
                link.target.id === d.id && link.source.id === selectedNode.id
            )
              ? "rgba(64, 196, 255, 0.6)" // Outgoing nodes
              : "rgba(255, 159, 64, 0.6)"; // Incoming nodes
          }
          return "rgba(98, 114, 164, 0.3)"; // Dim unconnected nodes
        }
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

    // Update labels
    labelsRef.current = labelsRef.current
      .data(data.nodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", "10px")
      .attr("fill", (d) => {
        if (!selectedNode) return "rgba(255,255,255,0.7)";
        const isConnected = allLinks.some(
          (link) =>
            (link.source.id === selectedNode.id && link.target.id === d.id) ||
            (link.target.id === selectedNode.id && link.source.id === d.id)
        );
        return selectedNode.id === d.id || isConnected
          ? "rgba(255,255,255,0.9)"
          : "rgba(255,255,255,0.3)";
      })
      .attr("dy", 20);

    // Apply forces to nodes and links
    simulation.nodes(data.nodes);
    simulation.force("link").links(allLinks);

    // Initialize node positions if they don't exist
    data.nodes.forEach((node) => {
      if (typeof node.x === "undefined" || typeof node.y === "undefined") {
        node.x = width / 2 + (Math.random() - 0.5) * 100;
        node.y = height / 2 + (Math.random() - 0.5) * 100;
      }
    });

    // Update positions on tick with arrow adjustments
    simulation.on("tick", () => {
      linksRef.current
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const angle = Math.atan2(dy, dx);
          const targetRadius = getNodeRadius(d.target);
          return d.target.x - targetRadius * Math.cos(angle);
        })
        .attr("y2", (d) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const angle = Math.atan2(dy, dx);
          const targetRadius = getNodeRadius(d.target);
          return d.target.y - targetRadius * Math.sin(angle);
        });

      nodesRef.current.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      labelsRef.current.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    // Cleanup
    return () => {
      if (simulation) {
        simulation.on("tick", null);
      }
    };
  }, [data, selectedNode, searchTerm, loading, setSelectedNode]);

  return (
    <div className="w-100 h-100">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <svg ref={svgRef} className="w-100 h-100">
          <defs>
            <marker
              id="arrowOut"
              viewBox="-10 -5 20 10"
              refX="0"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M -10 -5 L 0 0 L -10 5 z"
                fill="rgba(64, 196, 255, 0.4)"
              />
            </marker>
            <marker
              id="arrowIn"
              viewBox="-10 -5 20 10"
              refX="0"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M -10 -5 L 0 0 L -10 5 z"
                fill="rgba(255, 159, 64, 0.4)"
              />
            </marker>
          </defs>
        </svg>
      )}
    </div>
  );
};

export default D3Graph;
