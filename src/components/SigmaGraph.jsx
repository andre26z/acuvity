import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import forceAtlas2 from "graphology-layout-forceatlas2";

// Create a new component to handle interactions
const GraphEvents = ({ setSelectedNode }) => {
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

    // Register stage click to clear selection
    sigma.on("clickStage", () => {
      setSelectedNode(null);
    });

    // Cleanup listeners on unmount
    return () => {
      sigma.removeAllListeners("clickNode");
      sigma.removeAllListeners("clickStage");
    };
  }, [sigma, setSelectedNode]);

  return null;
};

const GraphLoader = ({ data, selectedNode }) => {
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
          x: Math.random() * 10 - 5, // Smaller range for initial positions
          y: Math.random() * 10 - 5,
        };
        positionsRef.current.set(node.id, position);
      } else {
        position = positionsRef.current.get(node.id);
      }

      graph.addNode(node.id, {
        ...position,
        size: selectedNode && selectedNode.id === node.id ? 8 : 5,
        label: node.name || node.id,
        color:
          selectedNode && selectedNode.id === node.id ? "#ff5555" : "#6272a4",
      });
    });

    // Add edges
    data.edges.forEach((edge) => {
      const sourceId =
        typeof edge.source === "object" ? edge.source.id : edge.source;
      const targetId =
        typeof edge.target === "object" ? edge.target.id : edge.target;
      const isConnected =
        selectedNode &&
        (sourceId === selectedNode.id || targetId === selectedNode.id);

      if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
        graph.addEdge(sourceId, targetId, {
          size: isConnected ? 2 : 1,
          color: isConnected ? "#ff5555" : "#858481",
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
  }, [loadGraph, data, selectedNode]);

  return null;
};

const SigmaGraph = ({ data, selectedNode, setSelectedNode, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: "600px" }}>
      <SigmaContainer style={{ height: "100%", width: "100%" }} settings={{}}>
        <GraphLoader data={data} selectedNode={selectedNode} />
        <GraphEvents setSelectedNode={setSelectedNode} />
      </SigmaContainer>
    </div>
  );
};

export default SigmaGraph;
