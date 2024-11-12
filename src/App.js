import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// Helper function to generate mock data
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
      timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    };
  });

  return { nodes, edges };
};

const GraphVisualization = () => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const chartRef = useRef(null);

  useEffect(() => {
    // Simulate API call to load data
    setLoading(true);
    setTimeout(() => {
      setData(generateMockData(50));
      setLoading(false);
    }, 500);
  }, []);

  // Prepare edge connections data
  const prepareEdgeConnections = (selectedNode, edges) => {
    if (!selectedNode) return [];
    
    return edges
      .filter(edge => 
        edge.source.id === selectedNode.id || 
        edge.target.id === selectedNode.id
      )
      .reduce((acc, edge) => {
        // Add source point
        acc.push({
          x: edge.source.x,
          y: edge.source.y,
          name: edge.source.name
        });
        // Add target point
        acc.push({
          x: edge.target.x,
          y: edge.target.y,
          name: edge.target.name
        });
        return acc;
      }, []);
  };

  // Prepare data for Chart.js
  const chartData = {
    datasets: [
      // Nodes dataset
      {
        label: 'Nodes',
        data: data.nodes.map(node => ({
          x: node.x,
          y: node.y,
          id: node.id,
          name: node.name,
          group: node.group,
        })),
        backgroundColor: data.nodes.map(node => 
          selectedNode?.id === node.id ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.6)'
        ),
        pointRadius: data.nodes.map(node => 
          selectedNode?.id === node.id ? 10 : 8
        ),
        pointHoverRadius: 12,
      },
      // Edges dataset
      ...(selectedNode ? [{
        label: 'Connections',
        data: prepareEdgeConnections(selectedNode, data.edges),
        showLine: true,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: 'rgba(75, 192, 192, 0.3)',
        pointRadius: 0,
        tension: 0.4
      }] : [])
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return point.name || `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
          },
        },
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

  // Get connected edges for selected node
  const getConnectedEdges = (nodeId) => {
    return data.edges.filter(edge => 
      edge.source.id === nodeId || edge.target.id === nodeId
    );
  };

  // Rest of the component remains the same...
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar */}
        <div className="col-md-3 col-lg-2 bg-light p-3 border-end min-vh-100">
          <div className="mb-4">
            <h5>Graph Controls</h5>
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setSelectedNode(null)}
              >
                Reset Selection
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <h6>Statistics</h6>
            <div className="small text-muted">
              <p>Total Nodes: {data.nodes.length}</p>
              <p>Total Edges: {data.edges.length}</p>
              {selectedNode && (
                <p>Connected Edges: {getConnectedEdges(selectedNode.id).length}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10 p-3">
          {/* Graph View */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Network Graph</h5>
            </div>
            <div className="card-body">
              <div style={{ height: '60vh' }}>
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Scatter ref={chartRef} data={chartData} options={chartOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Data Browser section remains the same... */}
          {selectedNode && (
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  Node Details: {selectedNode.name}
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Outgoing Connections</h6>
                    <div className="list-group">
                      {getConnectedEdges(selectedNode.id)
                        .filter(edge => edge.source.id === selectedNode.id)
                        .map((edge, i) => (
                          <div key={i} className="list-group-item">
                            <h6 className="mb-1">To: {edge.target.name}</h6>
                            <p className="mb-1 small">Weight: {edge.weight.toFixed(2)}</p>
                            <small className="text-muted">
                              Metric 1: {edge.metric1.toFixed(2)}<br />
                              Metric 2: {edge.metric2.toFixed(2)}
                            </small>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6>Incoming Connections</h6>
                    <div className="list-group">
                      {getConnectedEdges(selectedNode.id)
                        .filter(edge => edge.target.id === selectedNode.id)
                        .map((edge, i) => (
                          <div key={i} className="list-group-item">
                            <h6 className="mb-1">From: {edge.source.name}</h6>
                            <p className="mb-1 small">Weight: {edge.weight.toFixed(2)}</p>
                            <small className="text-muted">
                              Metric 1: {edge.metric1.toFixed(2)}<br />
                              Metric 2: {edge.metric2.toFixed(2)}
                            </small>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;