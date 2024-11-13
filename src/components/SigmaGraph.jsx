import React, { useEffect, useMemo } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";

// Component that loads and manages the graph
const GraphLoader = ({ data, selectedNode, setSelectedNode, searchTerm }) => {
  const loadGraph = useLoadGraph();

  // Memoize connected nodes and edges for better performance
  const connectedInfo = useMemo(() => {
    if (!selectedNode) return { nodes: new Set(), edges: new Set() };

    const connectedNodes = new Set();
    const connectedEdges = new Set();

    data.edges.forEach((edge) => {
      const sourceId = edge.source.id || edge.source;
      const targetId = edge.target.id || edge.target;

      if (sourceId === selectedNode.id) {
        connectedNodes.add(targetId);
        connectedEdges.add(`${sourceId}-${targetId}`);
      }
      if (targetId === selectedNode.id) {
        connectedNodes.add(sourceId);
        connectedEdges.add(`${sourceId}-${targetId}`);
      }
    });

    return { nodes: connectedNodes, edges: connectedEdges };
  }, [selectedNode, data.edges]);

  useEffect(() => {
    const graph = new Graph();

    // Add all nodes first
    data.nodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id;
      const isConnected = selectedNode
        ? connectedInfo.nodes.has(node.id)
        : false;
      const nodeColor = getNodeColor(node, isSelected, isConnected);
      const nodeSize = isSelected ? 12 : isConnected ? 10 : 8;

      graph.addNode(node.id, {
        label: node.name,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: nodeSize,
        color: nodeColor,
      });
    });

    // Add edges with visibility control
    data.edges.forEach((edge) => {
      const sourceId = edge.source.id || edge.source;
      const targetId = edge.target.id || edge.target;
      const edgeId = `${sourceId}-${targetId}`;

      // Only show edges if:
      // 1. No node is selected (show all edges), or
      // 2. The edge is connected to the selected node
      if (!selectedNode || connectedInfo.edges.has(edgeId)) {
        const edgeColor = getEdgeColor(edge, selectedNode);
        graph.addEdge(sourceId, targetId, {
          size: Math.sqrt(edge.weight || 1),
          color: edgeColor,
          type: "arrow",
          label: edge.weight?.toFixed(2),
        });
      }
    });

    loadGraph(graph);

    // Add click handlers
    graph.on("clickNode", (event) => {
      const nodeId = event.node;
      const nodeData = data.nodes.find((n) => n.id === nodeId);
      setSelectedNode(selectedNode?.id === nodeId ? null : nodeData);
    });

    // Add background click handler to deselect
    graph.on("clickStage", () => {
      setSelectedNode(null);
    });
  }, [
    loadGraph,
    data,
    selectedNode,
    searchTerm,
    setSelectedNode,
    connectedInfo,
  ]);

  // Helper function to determine node color
  const getNodeColor = (node, isSelected, isConnected) => {
    if (isSelected) {
      return "rgba(64, 196, 255, 0.8)"; // Bright blue for selected node
    }

    if (isConnected) {
      return "rgba(255, 159, 64, 0.6)"; // Orange for connected nodes
    }

    if (
      searchTerm &&
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return "rgba(255, 159, 64, 0.8)"; // Bright orange for search matches
    }

    return selectedNode
      ? "rgba(98, 114, 164, 0.3)" // Dim unconnected nodes when a node is selected
      : "rgba(98, 114, 164, 0.6)"; // Regular color when no selection
  };

  // Helper function to determine edge color
  const getEdgeColor = (edge, selectedNode) => {
    if (!selectedNode) return "rgba(255, 255, 255, 0.2)";

    const sourceId = edge.source.id || edge.source;
    return sourceId === selectedNode.id
      ? "rgba(64, 196, 255, 0.4)" // Outgoing edges
      : "rgba(255, 159, 64, 0.4)"; // Incoming edges
  };

  return null;
};

// Main component
const SigmaGraph = ({
  data,
  loading,
  selectedNode,
  setSelectedNode,
  searchTerm,
}) => {
  const containerStyle = {
    height: "50vh",
    width: "100%",
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <SigmaContainer style={containerStyle}>
      <GraphLoader
        data={data}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        searchTerm={searchTerm}
      />
    </SigmaContainer>
  );
};

export default SigmaGraph;
