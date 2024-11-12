import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import NetworkStatistics from "./components/NetworkStatistics";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const generateMockData = (nodeCount = 50) => {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node${i}`,
    name: `Node ${i}`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    group: Math.floor(Math.random() * 5),
  }));

  const edges = Array.from({ length: 100 }, () => {
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
};

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

  const chartRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const newData = generateMockData(50);
      setData(newData);

      const connectionCounts = newData.nodes.map((node) => {
        return newData.edges.filter(
          (edge) => edge.source.id === node.id || edge.target.id === node.id
        ).length;
      });

      setStatistics({
        avgConnections: (
          connectionCounts.reduce((a, b) => a + b, 0) / connectionCounts.length
        ).toFixed(1),
        maxConnections: Math.max(...connectionCounts),
        isolatedNodes: connectionCounts.filter((count) => count === 0).length,
      });

      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    const filtered = data.nodes.filter((node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNodes(filtered);
  }, [searchTerm, data.nodes]);

  const prepareEdgeConnections = (selectedNode, edges) => {
    if (!selectedNode) return [];

    return edges
      .filter(
        (edge) =>
          edge.source.id === selectedNode.id ||
          edge.target.id === selectedNode.id
      )
      .map((edge) => [
        {
          x: edge.source.x,
          y: edge.source.y,
          name: edge.source.name,
        },
        {
          x: edge.target.x,
          y: edge.target.y,
          name: edge.target.name,
        },
      ])
      .flat();
  };

  const chartData = {
    datasets: [
      {
        label: "Nodes",
        data: data.nodes.map((node) => ({
          x: node.x,
          y: node.y,
          id: node.id,
          name: node.name,
          group: node.group,
        })),
        backgroundColor: data.nodes.map((node) => {
          if (selectedNode?.id === node.id) return "rgba(64, 196, 255, 0.8)";
          if (
            searchTerm &&
            node.name.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return "rgba(255, 159, 64, 0.8)";
          }
          return "rgba(98, 114, 164, 0.6)";
        }),
        pointRadius: data.nodes.map((node) =>
          selectedNode?.id === node.id ||
          (searchTerm &&
            node.name.toLowerCase().includes(searchTerm.toLowerCase()))
            ? 12
            : 8
        ),
        pointHoverRadius: 15,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.8)",
        elements: {
          point: {
            radius: 8,
            cursor: "pointer",
          },
        },
      },
      ...(selectedNode
        ? [
            {
              label: "Connections",
              data: prepareEdgeConnections(selectedNode, data.edges),
              showLine: true,
              backgroundColor: "transparent",
              borderColor: "rgba(64, 196, 255, 0.4)",
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.2,
              fill: false,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
    elements: {
      point: {
        hoverCursor: "pointer",
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return (
              point.name || `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`
            );
          },
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
      legend: {
        display: false,
      },
    },

    onClick: (event, elements) => {
      if (elements.length > 0) {
        const pointIndex = elements[0].index;
        const node = data.nodes[pointIndex];
        setSelectedNode(node);
      } else {
        setSelectedNode(null);
      }
    },
  };

  const getConnectedEdges = (nodeId) => {
    return data.edges.filter(
      (edge) => edge.source.id === nodeId || edge.target.id === nodeId
    );
  };

  return (
    <div className="container-fluid p-0 bg-dark text-light min-vh-100">
      <div className="row g-1">
        {/* Sidebar - Only visible on larger screens (≥760px) */}
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
                        style={{
                          cursor: "pointer",
                        }}
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
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Scatter
                    ref={chartRef}
                    data={chartData}
                    options={chartOptions}
                  />
                )}
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

            {/* Statistics for mobile view - Only visible below 760px */}
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
