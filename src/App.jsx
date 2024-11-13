import React, { useState, useEffect, useCallback, Suspense } from "react";
import NetworkStatistics from "./components/NetworkStatistics";
import SigmaGraph from "./components/SigmaGraph";
import DataBrowser from "./components/DataBrowser";

const GraphVisualization = () => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    avgConnections: 0,
    maxConnections: 0,
    isolatedNodes: 0,
  });

  // Generate mock data with more connections
  const generateMockData = useCallback((nodeCount = 1000) => {
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node${i}`,
      name: `Node ${i}`,
      group: Math.floor(Math.random() * 5),
      radius: 15,
    }));

    // Use a Set to track existing edges
    const edgeSet = new Set();
    const edges = [];

    // Helper function to add edge if it doesn't exist
    const addEdgeIfNotExists = (source, target) => {
      const edgeKey = `${source}-${target}`;
      const reverseEdgeKey = `${target}-${source}`;

      if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseEdgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          source: nodes[source],
          target: nodes[target],
          weight: Math.random() * 10,
          metric1: Math.random() * 100,
          metric2: Math.random() * 1000,
          timestamp: new Date(
            Date.now() - Math.random() * 10000000000
          ).toISOString(),
        });
        return true;
      }
      return false;
    };

    // Create initial connections (ring topology)
    for (let i = 0; i < nodes.length; i++) {
      const nextIndex = (i + 1) % nodes.length;
      addEdgeIfNotExists(i, nextIndex);
    }

    // Add random connections
    const targetEdgeCount = Math.min(50000);
    let attempts = 0;
    const maxAttempts = targetEdgeCount * 2;

    while (edges.length < targetEdgeCount && attempts < maxAttempts) {
      const source = Math.floor(Math.random() * nodeCount);
      let target = Math.floor(Math.random() * nodeCount);

      // Avoid self-loops
      if (source !== target) {
        // Add edge with distance-based probability
        const distance = Math.abs(target - source);
        const probability = 1 / (1 + distance / 100);

        if (Math.random() < probability) {
          addEdgeIfNotExists(source, target);
        }
      }
      attempts++;
    }

    // Add hub connections
    const hubCount = Math.floor(nodeCount * 0.01); // 1% of nodes are hubs
    for (let i = 0; i < hubCount; i++) {
      const hubIndex = Math.floor(Math.random() * nodeCount);
      const connectionCount = Math.floor(nodeCount * 0.05); // 5% connections per hub

      let hubAttempts = 0;
      while (hubAttempts < connectionCount * 2) {
        const target = Math.floor(Math.random() * nodeCount);
        if (hubIndex !== target) {
          addEdgeIfNotExists(hubIndex, target);
        }
        hubAttempts++;
      }
    }

    return { nodes, edges };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const newData = generateMockData(1000);
        setData(newData);

        const connectionCounts = newData.nodes.map((node) => {
          return newData.edges.filter(
            (edge) => edge.source.id === node.id || edge.target.id === node.id
          ).length;
        });

        setStatistics({
          avgConnections: (
            connectionCounts.reduce((a, b) => a + b, 0) /
            connectionCounts.length
          ).toFixed(1),
          maxConnections: Math.max(...connectionCounts),
          isolatedNodes: connectionCounts.filter((count) => count === 0).length,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [generateMockData]);

  const getConnectedEdges = useCallback(
    (nodeId) => {
      return data.edges.filter(
        (edge) => edge.source.id === nodeId || edge.target.id === nodeId
      );
    },
    [data.edges]
  );

  return (
    <div className="container-fluid p-0 bg-dark text-light min-vh-100">
      <div className="row g-1">
        {/* Sidebar */}
        <div
          className="col-md-3 d-none d-md-block border-end border-secondary"
          style={{ background: "#1a1b26" }}
        >
          <div className="p-3">
            <NetworkStatistics
              data={data}
              statistics={statistics}
              selectedNode={selectedNode}
              getConnectedEdges={getConnectedEdges}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="col-12 col-md-9">
          <div
            className="p-3"
            style={{ background: "#1a1b26", minHeight: "100vh" }}
          >
            {/* Network Graph Card */}
            <div className="card bg-dark border-secondary mb-3 mt-1">
              <div className="card-header bg-dark border-secondary d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 text-light">Network Graph</h5>
                <button
                  className="btn btn-outline-info w-10"
                  onClick={() => setSelectedNode(null)}
                >
                  Reset Selection
                </button>
              </div>
              <div
                className="card-body p-0"
                style={{ background: "#1a1b26", height: "50vh" }}
              >
                <Suspense>
                  <SigmaGraph
                    data={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                  />
                </Suspense>
              </div>
            </div>

            {/* Data Browser Card */}
            <DataBrowser
              selectedNode={selectedNode}
              getConnectedEdges={getConnectedEdges}
            />

            {/* Mobile Statistics */}
            <div className="d-md-none pt-2">
              <div className="card bg-dark border-secondary">
                <div className="card-body">
                  <NetworkStatistics
                    data={data}
                    statistics={statistics}
                    selectedNode={selectedNode}
                    getConnectedEdges={getConnectedEdges}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;
