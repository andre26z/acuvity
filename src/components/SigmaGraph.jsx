import React, { useEffect } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

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

  useEffect(() => {
    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node) => {
      graph.addNode(node.id, {
        x: Math.random() * 500,
        y: Math.random() * 500,
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
      <SigmaContainer
        style={{ height: "100%", width: "100%" }}
        settings={{
          defaultNodeColor: "#6272a4",
          defaultEdgeColor: "#858481",
          labelSize: 12,
          labelWeight: "bold",
          renderLabels: true,
          minCameraRatio: 0.1,
          maxCameraRatio: 1,
          nodeProgramClasses: {},
          nodeReducer: (node, data) => ({
            ...data,
            highlighted: selectedNode && selectedNode.id === node,
          }),
        }}
      >
        <GraphLoader data={data} selectedNode={selectedNode} />
        <GraphEvents setSelectedNode={setSelectedNode} />
      </SigmaContainer>
    </div>
  );
};

export default SigmaGraph;
