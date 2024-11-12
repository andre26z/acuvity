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

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

// Previous helper functions remain the same...
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
  // Previous state declarations and useEffects remain the same...
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredNodes, setFilteredNodes] = useState([]);
  
  const chartRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(generateMockData(50));
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    const filtered = data.nodes.filter(node =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNodes(filtered);
  }, [searchTerm, data.nodes]);

  // Previous helper functions remain the same...
  const prepareEdgeConnections = (selectedNode, edges) => {
    if (!selectedNode) return [];
    
    return edges
      .filter(edge => 
        edge.source.id === selectedNode.id || 
        edge.target.id === selectedNode.id
      )
      .map(edge => [
        {
          x: edge.source.x,
          y: edge.source.y,
          name: edge.source.name
        },
        {
          x: edge.target.x,
          y: edge.target.y,
          name: edge.target.name
        }
      ])
      .flat();
  };

  const chartData = {
    datasets: [
      {
        label: 'Nodes',
        data: data.nodes.map(node => ({
          x: node.x,
          y: node.y,
          id: node.id,
          name: node.name,
          group: node.group,
        })),
        backgroundColor: data.nodes.map(node => {
          if (selectedNode?.id === node.id) return 'rgba(64, 196, 255, 0.8)';
          if (searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return 'rgba(255, 159, 64, 0.8)';
          }
          return 'rgba(98, 114, 164, 0.6)';
        }),
        pointRadius: data.nodes.map(node => 
          selectedNode?.id === node.id || 
          (searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase())) 
            ? 12 
            : 8
        ),
        pointHoverRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
      },
      ...(selectedNode ? [{
        label: 'Connections',
        data: prepareEdgeConnections(selectedNode, data.edges),
        showLine: true,
        backgroundColor: 'transparent',
        borderColor: 'rgba(64, 196, 255, 0.4)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        fill: false
      }] : [])
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        }
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    return data.edges.filter(edge => 
      edge.source.id === nodeId || edge.target.id === nodeId
    );
  };

  return (
    <div className="min-vh-100 bg-dark text-light" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="flex-grow-1 d-flex">
        {/* Sidebar */}
        <div className="border-end border-secondary p-4" style={{ width: '280px', background: '#1a1b26' }}>
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
                <div className="position-absolute w-100 mt-1 bg-dark border border-secondary rounded shadow-sm" style={{ zIndex: 1000 }}>
                  {filteredNodes.map(node => (
                    <div
                      key={node.id}
                      className="p-2 border-bottom border-secondary cursor-pointer hover:bg-secondary"
                      onClick={() => {
                        setSelectedNode(node);
                        setSearchTerm('');
                      }}
                    >
                      {node.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              className="btn btn-outline-info w-100"
              onClick={() => setSelectedNode(null)}
            >
              Reset Selection
            </button>
          </div>
          
          <div className="mb-4">
            <h6 className="text-light">Statistics</h6>
            <div className="text-muted">
              <p className="mb-2">Total Nodes: {data.nodes.length}</p>
              <p className="mb-2">Total Edges: {data.edges.length}</p>
              {selectedNode && (
                <p className="mb-2">Connected Edges: {getConnectedEdges(selectedNode.id).length}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column p-4" style={{ background: '#1a1b26' }}>
          <div className="card bg-dark border-secondary flex-grow-1 mb-4">
            <div className="card-header bg-dark border-secondary">
              <h5 className="card-title mb-0 text-light">Network Graph</h5>
            </div>
            <div className="card-body p-0" style={{ background: '#1a1b26' }}>
              <div style={{ height: '80%', minHeight: '500px' }}>
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Scatter ref={chartRef} data={chartData} options={chartOptions} />
                )}
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="card bg-dark border-secondary mt-auto">
              <div className="card-header bg-dark border-secondary">
                <h5 className="card-title mb-0 text-light">
                  Node Details: {selectedNode.name}
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-info">Outgoing Connections</h6>
                    <div className="list-group bg-dark">
                      {getConnectedEdges(selectedNode.id)
                        .filter(edge => edge.source.id === selectedNode.id)
                        .map((edge, i) => (
                          <div key={i} className="list-group-item bg-dark text-light border-secondary">
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
                    <h6 className="text-info">Incoming Connections</h6>
                    <div className="list-group bg-dark">
                      {getConnectedEdges(selectedNode.id)
                        .filter(edge => edge.target.id === selectedNode.id)
                        .map((edge, i) => (
                          <div key={i} className="list-group-item bg-dark text-light border-secondary">
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