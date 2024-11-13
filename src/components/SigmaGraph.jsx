import React, { useEffect } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

const GraphLoader = ({ data }) => {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node) => {
      graph.addNode(node.id, {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 8,
        label: node.name || node.id,
        color: "#6272a4",
      });
    });

    // Add edges
    data.edges.forEach((edge) => {
      const sourceId =
        typeof edge.source === "object" ? edge.source.id : edge.source;
      const targetId =
        typeof edge.target === "object" ? edge.target.id : edge.target;

      if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
        graph.addEdge(sourceId, targetId, {
          size: 1,
          color: "#858481",
        });
      }
    });

    loadGraph(graph);
  }, [loadGraph, data]);

  return null;
};

const SigmaGraph = ({ data, loading }) => {
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
          defaultEdgeColor: "#0000",
          labelSize: 12,
          labelWeight: "bold",
          renderLabels: true,
          minCameraRatio: 0.4,
          maxCameraRatio: 1,
        }}
      >
        <GraphLoader data={data} />
      </SigmaContainer>
    </div>
  );
};

export default SigmaGraph;
