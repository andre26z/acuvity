import React, { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import forceAtlas2 from "graphology-layout-forceatlas2";

// Create a new component to handle interactions
const GraphEvents = ({ setSelectedNode, setHoveredNode }) => {
  const sigma = useSigma();

  useEffect(() => {
    // Register click events
    sigma.on("clickNode", (event) => {
      const node = event.node;
      const nodeAttributes = sigma.getGraph().getNodeAttributes(node);
      setSelectedNode({
        id: node,
        name: nodeAttributes.label,
      });
    });

    // Register hover events
    sigma.on("enterNode", (event) => {
      const node = event.node;
      const nodeAttributes = sigma.getGraph().getNodeAttributes(node);
      setHoveredNode({
        id: node,
        name: nodeAttributes.label,
      });
    });

    sigma.on("leaveNode", () => {
      setHoveredNode(null);
    });

    // Register stage click to clear selection
    sigma.on("clickStage", () => {
      setSelectedNode(null);
    });

    // Cleanup listeners on unmount
    return () => {
      sigma.removeAllListeners();
    };
  }, [sigma, setSelectedNode, setHoveredNode]);

  return null;
};

const GraphLoader = ({ data, selectedNode, hoveredNode }) => {
  const loadGraph = useLoadGraph();
  const positionsRef = useRef(new Map());

  useEffect(() => {
    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node) => {
      // Get cached position or create new one
      let position;
      if (!positionsRef.current.has(node.id)) {
        position = {
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
        };
        positionsRef.current.set(node.id, position);
      } else {
        position = positionsRef.current.get(node.id);
      }

      const isSelected = selectedNode && selectedNode.id === node.id;
      const isHovered = hoveredNode && hoveredNode.id === node.id;

      graph.addNode(node.id, {
        ...position,
        size: isSelected || isHovered ? 8 : 5,
        label: node.name || node.id,
        color: isSelected ? "#ff5555" : isHovered ? "#ff8855" : "#6272a4",
      });
    });

    // Add edges with hidden state by default
    data.edges.forEach((edge) => {
      const sourceId =
        typeof edge.source === "object" ? edge.source.id : edge.source;
      const targetId =
        typeof edge.target === "object" ? edge.target.id : edge.target;

      // Check if edge is connected to selected or hovered node
      const isConnectedToSelected =
        selectedNode &&
        (sourceId === selectedNode.id || targetId === selectedNode.id);
      const isConnectedToHovered =
        hoveredNode &&
        (sourceId === hoveredNode.id || targetId === hoveredNode.id);

      // Check if this is an outgoing edge from the selected/hovered node
      const isOutgoingSelected = selectedNode && sourceId === selectedNode.id;
      const isOutgoingHovered = hoveredNode && sourceId === hoveredNode.id;

      // Only show edges connected to selected or hovered nodes
      const isVisible = isConnectedToSelected || isConnectedToHovered;

      if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
        graph.addEdge(sourceId, targetId, {
          size: isVisible ? 3 : 0, // Hide edges by setting size to 0
          color: isOutgoingSelected
            ? "#08afd1" // Outgoing from selected node
            : isOutgoingHovered
            ? "#08afd1" // Outgoing from hovered node
            : isConnectedToSelected
            ? "#dba604" // Incoming to selected node
            : isConnectedToHovered
            ? "#dba604" // Incoming to hovered node
            : "#000",
          hidden: !isVisible, // Additional property to ensure edge is hidden
        });
      }
    });

    // Apply force-directed layout only on initial render
    if (positionsRef.current.size === 0) {
      const settings = {
        iterations: 50,
        settings: {
          gravity: 1,
          adjustSizes: true,
          linLogMode: true,
          strongGravityMode: true,
          scalingRatio: 2,
        },
      };

      forceAtlas2.assign(graph, settings);

      // Store the calculated positions
      graph.forEachNode((nodeId, attributes) => {
        positionsRef.current.set(nodeId, {
          x: attributes.x,
          y: attributes.y,
        });
      });
    }

    loadGraph(graph);
  }, [loadGraph, data, selectedNode, hoveredNode]);

  return null;
};

const SigmaGraph = ({ data, selectedNode, setSelectedNode, loading }) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[700px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-100">
      <SigmaContainer
        style={{
          height: "100%",
          width: "100%",
          background: "#1a1B26",
        }}
        settings={{
          minCameraRatio: 0.1,
          maxCameraRatio: 0.8,
          defaultNodeType: "circle",
          defaultEdgeType: "line",

          labelWeight: "bold",

          hideEdgesOnMove: false,
        }}
      >
        <GraphLoader
          data={data}
          selectedNode={selectedNode}
          hoveredNode={hoveredNode}
        />
        <GraphEvents
          setSelectedNode={setSelectedNode}
          setHoveredNode={setHoveredNode}
        />
      </SigmaContainer>
    </div>
  );
};

export default SigmaGraph;
