import React, { useState, useEffect, useCallback } from "react";
import NetworkStatistics from "./components/NetworkStatistics";
import D3Graph from "./components/D3Graph";

const GraphVisualization = () => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [statistics, setStatistics] = useState({
    avgConnections: 0,
    maxConnections: 0,
    isolatedNodes: 0,
  });

  // Memoize generateMockData
  const generateMockData = useCallback((nodeCount = 50) => {
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `node${i}`,
      name: `Node ${i}`,
      group: Math.floor(Math.random() * 5),
      radius: 8,
    }));

    const edgeCount = Math.min(nodeCount * 2, 100);
    const edges = Array.from({ length: edgeCount }, () => {
      const source = Math.floor(Math.random() * nodeCount);
      const target = Math.floor(Math.random() * nodeCount);
      return {
        source: nodes[source],
        target: nodes[target],
        weight: Math.random() * 10,
        metric1: Math.random() * 100,
        metric2: Math.random() * 1000,
        timestamp: new Date(
          Date.now() - Math.random() * 10000000000
        ).toISOString(),
      };
    });

    return { nodes, edges };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const newData = generateMockData(50);
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

  // Update filtered nodes
  useEffect(() => {
    const filtered = data.nodes.filter((node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNodes(filtered);
  }, [searchTerm, data.nodes]);

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
            <div className="mb-4">
              <h5 className="text-light mb-3">Graph Controls</h5>
              <div className="position-relative mb-3">
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && filteredNodes.length > 0 && (
                  <div
                    className="position-absolute w-100 mt-1 bg-dark border border-secondary rounded shadow-sm"
                    style={{
                      zIndex: 1000,
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredNodes.map((node) => (
                      <div
                        key={node.id}
                        className="p-2 border-bottom border-secondary hover:bg-secondary"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedNode(node);
                          setSearchTerm("");
                        }}
                      >
                        {node.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
            <div className="card bg-dark border-secondary mb-3">
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
                style={{ background: "#1a1b26", height: "60vh" }}
              >
                <D3Graph
                  data={data}
                  loading={loading}
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  searchTerm={searchTerm}
                />
              </div>
            </div>

            {/* Node Details Card */}
            <div className="card bg-dark border-secondary mb-3">
              <div className="card-header bg-dark border-secondary">
                <h5 className="card-title mb-0 text-light">
                  {selectedNode
                    ? `Node Details: ${selectedNode.name}`
                    : "Node Details"}
                </h5>
              </div>
              <div
                className="card-body"
                style={{ maxHeight: "30vh", overflowY: "auto" }}
              >
                {selectedNode ? (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <h6 className="text-info">Outgoing Connections</h6>
                      <div className="list-group bg-dark">
                        {getConnectedEdges(selectedNode.id)
                          .filter((edge) => edge.source.id === selectedNode.id)
                          .map((edge, i) => (
                            <div
                              key={i}
                              className="list-group-item bg-dark text-light border-secondary p-2"
                            >
                              <h6 className="mb-1 fs-6">
                                To: {edge.target.name}
                              </h6>
                              <p className="mb-1 small">
                                Weight: {edge.weight.toFixed(2)}
                              </p>
                              <small className="text-muted d-block">
                                Metric 1: {edge.metric1.toFixed(2)}
                                <br />
                                Metric 2: {edge.metric2.toFixed(2)}
                              </small>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <h6 className="text-info">Incoming Connections</h6>
                      <div className="list-group bg-dark">
                        {getConnectedEdges(selectedNode.id)
                          .filter((edge) => edge.target.id === selectedNode.id)
                          .map((edge, i) => (
                            <div
                              key={i}
                              className="list-group-item bg-dark text-light border-secondary p-2"
                            >
                              <h6 className="mb-1 fs-6">
                                From: {edge.source.name}
                              </h6>
                              <p className="mb-1 small">
                                Weight: {edge.weight.toFixed(2)}
                              </p>
                              <small className="text-muted d-block">
                                Metric 1: {edge.metric1.toFixed(2)}
                                <br />
                                Metric 2: {edge.metric2.toFixed(2)}
                              </small>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted p-4">
                    <h6>No node selected</h6>
                    <p>Click on a node in the graph to view its details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Statistics */}
            <div className="d-md-none">
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
