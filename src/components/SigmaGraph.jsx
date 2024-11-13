import React, { useEffect, useRef, useState, useCallback } from "react";
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

    // Register hover events with debouncing for better performance
    let hoverTimeout;
    sigma.on("enterNode", (event) => {
      clearTimeout(hoverTimeout);
      const node = event.node;
      const nodeAttributes = sigma.getGraph().getNodeAttributes(node);
      hoverTimeout = setTimeout(() => {
        setHoveredNode({
          id: node,
          name: nodeAttributes.label,
        });
      }, 50); // Small delay to prevent rapid state updates
    });

    sigma.on("leaveNode", () => {
      clearTimeout(hoverTimeout);
      setHoveredNode(null);
    });

    // Register stage click to clear selection
    sigma.on("clickStage", () => {
      setSelectedNode(null);
    });

    // Cleanup listeners on unmount
    return () => {
      clearTimeout(hoverTimeout);
      sigma.removeAllListeners();
    };
  }, [sigma, setSelectedNode, setHoveredNode]);

  return null;
};

const GraphLoader = ({ data, selectedNode, hoveredNode, getSampledEdges }) => {
  const loadGraph = useLoadGraph();
  const positionsRef = useRef(new Map());
  const graphRef = useRef(null);

  // Memoize edge processing
  const processEdges = useCallback(
    (edges, sourceId, targetId) => {
      const isConnectedToSelected =
        selectedNode &&
        (sourceId === selectedNode.id || targetId === selectedNode.id);
      const isConnectedToHovered =
        hoveredNode &&
        (sourceId === hoveredNode.id || targetId === hoveredNode.id);

      const isOutgoingSelected = selectedNode && sourceId === selectedNode.id;
      const isOutgoingHovered = hoveredNode && sourceId === hoveredNode.id;

      return {
        isVisible: isConnectedToSelected || isConnectedToHovered,
        color: isOutgoingSelected
          ? "#08afd1"
          : isOutgoingHovered
          ? "#08afd1"
          : isConnectedToSelected
          ? "#dba604"
          : isConnectedToHovered
          ? "#dba604"
          : "#000",
      };
    },
    [selectedNode, hoveredNode]
  );

  useEffect(() => {
    const graph = new Graph();
    graphRef.current = graph;

    // Add nodes with optimized attribute handling
    const nodeAttributes = new Map();
    data.nodes.forEach((node) => {
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

      nodeAttributes.set(node.id, {
        ...position,
        size: isSelected || isHovered ? 8 : 5,
        label: node.name || node.id,
        color: isSelected ? "#ff5555" : isHovered ? "#ff8855" : "#6272a4",
      });
    });

    // Batch node addition
    nodeAttributes.forEach((attrs, nodeId) => {
      graph.addNode(nodeId, attrs);
    });

    // Sample edges when needed
    let edgesToProcess = data.edges;
    if (data.edges.length > 5000 && !selectedNode && !hoveredNode) {
      edgesToProcess = getSampledEdges(data.edges);
    }

    // Batch edge addition with sampling
    const edgeBatch = [];
    edgesToProcess.forEach((edge) => {
      const sourceId =
        typeof edge.source === "object" ? edge.source.id : edge.source;
      const targetId =
        typeof edge.target === "object" ? edge.target.id : edge.target;

      if (graph.hasNode(sourceId) && graph.hasNode(targetId)) {
        const { isVisible, color } = processEdges(edge, sourceId, targetId);
        edgeBatch.push({
          source: sourceId,
          target: targetId,
          attributes: {
            size: isVisible ? 3 : 0,
            color,
            hidden: !isVisible,
            weight: edge.weight,
          },
        });
      }
    });

    // Add edges in batch
    edgeBatch.forEach(({ source, target, attributes }) => {
      graph.addEdge(source, target, attributes);
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

    return () => {
      if (graphRef.current) {
        graphRef.current.clear();
      }
    };
  }, [
    loadGraph,
    data,
    selectedNode,
    hoveredNode,
    processEdges,
    getSampledEdges,
  ]);

  return null;
};

const SigmaGraph = ({
  data,
  selectedNode,
  setSelectedNode,
  loading,
  getSampledEdges = (edges) => edges.filter((_, i) => i % 5 === 0), // Default sampling
}) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 h-100">
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
          hideEdgesOnMove: true,
          renderLabels: false,
          labelRenderedSizeThreshold: 12,
          labelDensity: 0.5,
          labelGridCellSize: 100,
          zIndex: true,
        }}
      >
        <GraphLoader
          data={data}
          selectedNode={selectedNode}
          hoveredNode={hoveredNode}
          getSampledEdges={getSampledEdges}
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
