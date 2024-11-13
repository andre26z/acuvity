import React, { useState, useEffect, useCallback, Suspense } from "react";
import NetworkStatistics from "./components/NetworkStatistics.jsx";
import SigmaGraph from "./components/SigmaGraph.jsx";
import DataBrowser from "./components/DataBrowser.jsx";

const GraphVisualization = () => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

    const edgeSet = new Set();
    const edges = [];

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

      if (source !== target) {
        const distance = Math.abs(target - source);
        const probability = 1 / (1 + distance / 100);

        if (Math.random() < probability) {
          addEdgeIfNotExists(source, target);
        }
      }
      attempts++;
    }

    // Add hub connections
    const hubCount = Math.floor(nodeCount * 0.01);
    for (let i = 0; i < hubCount; i++) {
      const hubIndex = Math.floor(Math.random() * nodeCount);
      const connectionCount = Math.floor(nodeCount * 0.05);

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
      setIsLoading(true);
      try {
        const newData = generateMockData(1000);
        setData(newData);

        const connectionCounts = newData.nodes.map((node) => {
          return newData.edges.filter(
            (edge) => edge.source.id === node.id || edge.target.id === node.id
          ).length;
        });

        setStatistics({
          avgConnections: Number(
            (
              connectionCounts.reduce((a, b) => a + b, 0) /
              connectionCounts.length
            ).toFixed(1)
          ),
          maxConnections: Math.max(...connectionCounts),
          isolatedNodes: connectionCounts.filter((count) => count === 0).length,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
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
    <div
      className="min-vh-100 d-flex flex-column"
      style={{
        background: "#1a1b26",
        minHeight: "100vh",
        height: "100%",
      }}
    >
      <div className="container-fluid flex-grow-1">
        <div className="row g-1 h-100">
          {/* Left Sidebar - Statistics (Desktop only) */}
          <div
            className="col-xl-2 d-none d-xl-block border-end border-secondary" // Changed from col-md-2 d-md-block
            style={{
              background: "#1a1b26",
              position: "sticky",
              top: 0,
              height: "100vh",
              overflowY: "auto",
            }}
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

          {/* Main Content Area */}
          <div className="col-12 col-xl-10 h-100">
            <div className="p-3 h-100">
              {/* Network Graph and Data Browser Container */}
              <div className="row g-3 h-100">
                {/* Network Graph Card */}
                <div className="col-12 col-xl-7">
                  <div className="card bg-dark border-secondary h-100">
                    <div className="card-header bg-dark border-secondary d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0 text-light">
                        Network Graph
                      </h5>
                      <button
                        className="btn btn-outline-info btn-sm"
                        onClick={() => setSelectedNode(null)}
                      >
                        Reset Selection
                      </button>
                    </div>
                    <div
                      className="card-body p-0 position-relative"
                      style={{
                        height: "calc(100vh - 200px)",
                        overflowY: "auto",
                      }}
                    >
                      <Suspense fallback={<div>Loading...</div>}>
                        <SigmaGraph
                          data={data}
                          loading={isLoading}
                          selectedNode={selectedNode}
                          setSelectedNode={setSelectedNode}
                        />
                      </Suspense>
                    </div>
                  </div>
                </div>

                {/* Data Browser Card */}
                <div className="col-12 col-xl-5 h-100">
                  <div
                    className="h-100"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      height: "calc(100vh - 200px)", // Match the Network Graph height
                    }}
                  >
                    <DataBrowser
                      selectedNode={selectedNode}
                      getConnectedEdges={getConnectedEdges}
                    />

                    {/* Mobile Statistics */}
                    <div className="d-xl-none mt-3">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;
