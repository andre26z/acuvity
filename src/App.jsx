import React, { useState, useEffect, useCallback, Suspense } from "react";
import NetworkStatistics from "./components/NetworkStatistics";
import SigmaGraph from "./components/SigmaGraph";
import DataBrowser from "./components/DataBrowser";

const App = () => {
  // State Management
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [viewMode, setViewMode] = useState("distributed"); // 'distributed' or 'concentrated'
  const [edgeDisplayMode, setEdgeDisplayMode] = useState("sample"); // 'sample' or 'all'
  const [edgePage, setEdgePage] = useState(1);
  const [edgeFilters, setEdgeFilters] = useState({
    timeRange: [null, null],
    metric1Range: [0, 100],
    metric2Range: [0, 1000],
    weightRange: [0, 10],
  });

  // Constants
  const EDGES_PER_PAGE = 1000;
  const SAMPLE_SIZE = 1000;
  const NODE_COUNT = viewMode === "distributed" ? 50000 : 2;

  // Statistics state
  const [statistics, setStatistics] = useState({
    avgConnections: 0,
    maxConnections: 0,
    isolatedNodes: 0,
    totalEdges: 0,
    avgWeight: 0,
    densityScore: 0,
  });

  // Edge sampling and pagination
  const getSampledEdges = useCallback((edges, sampleSize = SAMPLE_SIZE) => {
    if (edges.length <= sampleSize) return edges;
    const step = Math.floor(edges.length / sampleSize);
    return edges.filter((_, index) => index % step === 0);
  }, []);

  // Get paged edges for a specific node
  const getPagedEdges = useCallback(
    (nodeId, page = 1) => {
      const start = (page - 1) * EDGES_PER_PAGE;
      const end = start + EDGES_PER_PAGE;

      // Apply filters
      const filteredEdges = data.edges.filter((edge) => {
        const timestamp = new Date(edge.timestamp);
        const isInTimeRange =
          !edgeFilters.timeRange[0] ||
          !edgeFilters.timeRange[1] ||
          (timestamp >= new Date(edgeFilters.timeRange[0]) &&
            timestamp <= new Date(edgeFilters.timeRange[1]));

        const isInMetric1Range =
          edge.metric1 >= edgeFilters.metric1Range[0] &&
          edge.metric1 <= edgeFilters.metric1Range[1];

        const isInMetric2Range =
          edge.metric2 >= edgeFilters.metric2Range[0] &&
          edge.metric2 <= edgeFilters.metric2Range[1];

        const isInWeightRange =
          edge.weight >= edgeFilters.weightRange[0] &&
          edge.weight <= edgeFilters.weightRange[1];

        return (
          (edge.source.id === nodeId || edge.target.id === nodeId) &&
          isInTimeRange &&
          isInMetric1Range &&
          isInMetric2Range &&
          isInWeightRange
        );
      });

      return {
        edges: filteredEdges.slice(start, end),
        total: filteredEdges.length,
      };
    },
    [data.edges, edgeFilters]
  );

  // Generate mock data
  const generateMockData = useCallback(
    (nodeCount = NODE_COUNT) => {
      const nodes = Array.from({ length: nodeCount }, (_, i) => ({
        id: `node${i}`,
        name: `Node ${i}`,
        group: Math.floor(Math.random() * 5),
        radius: 8,
      }));

      let edges = [];
      const edgeCount =
        viewMode === "concentrated" ? 100000 : Math.min(nodeCount * 10, 50000);

      if (viewMode === "concentrated") {
        // Generate 100k edges between 2 nodes
        edges = Array.from({ length: edgeCount }, () => ({
          source: nodes[0],
          target: nodes[1],
          weight: Math.random() * 10,
          metric1: Math.random() * 100,
          metric2: Math.random() * 1000,
          timestamp: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }));
      } else {
        // Generate distributed edges
        const edgeSet = new Set();

        // Create base connectivity (ring topology)
        for (let i = 0; i < nodes.length; i++) {
          const nextIndex = (i + 1) % nodes.length;
          const edgeKey = `${i}-${nextIndex}`;
          if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            edges.push({
              source: nodes[i],
              target: nodes[nextIndex],
              weight: Math.random() * 10,
              metric1: Math.random() * 100,
              metric2: Math.random() * 1000,
              timestamp: new Date(
                Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
              ).toISOString(),
            });
          }
        }

        // Add remaining random edges
        while (edges.length < edgeCount) {
          const source = Math.floor(Math.random() * nodeCount);
          const target = Math.floor(Math.random() * nodeCount);

          if (source !== target) {
            const edgeKey = `${source}-${target}`;
            if (!edgeSet.has(edgeKey)) {
              edgeSet.add(edgeKey);
              edges.push({
                source: nodes[source],
                target: nodes[target],
                weight: Math.random() * 10,
                metric1: Math.random() * 100,
                metric2: Math.random() * 1000,
                timestamp: new Date(
                  Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
                ).toISOString(),
              });
            }
          }
        }
      }

      return { nodes, edges };
    },
    [viewMode]
  );

  // Calculate statistics
  const calculateStatistics = useCallback((nodes, edges) => {
    const connectionCounts = nodes.map((node) => {
      return edges.filter(
        (edge) => edge.source.id === node.id || edge.target.id === node.id
      ).length;
    });

    const totalConnections = connectionCounts.reduce((a, b) => a + b, 0);
    const maxPossibleConnections = nodes.length * (nodes.length - 1);

    return {
      avgConnections: (totalConnections / nodes.length).toFixed(1),
      maxConnections: Math.max(...connectionCounts),
      isolatedNodes: connectionCounts.filter((count) => count === 0).length,
      totalEdges: edges.length,
      avgWeight: (
        edges.reduce((sum, edge) => sum + edge.weight, 0) / edges.length
      ).toFixed(2),
      densityScore: ((totalConnections / maxPossibleConnections) * 100).toFixed(
        2
      ),
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const newData = generateMockData();
        setData(newData);
        setStatistics(calculateStatistics(newData.nodes, newData.edges));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [generateMockData, calculateStatistics]);

  // Filter nodes based on search
  useEffect(() => {
    const filtered = data.nodes.filter((node) =>
      node.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredNodes(filtered);
  }, [searchTerm, data.nodes]);

  // Get connected edges for selected node
  const getConnectedEdges = useCallback(
    (nodeId) => {
      if (edgeDisplayMode === "sample") {
        const allEdges = data.edges.filter(
          (edge) => edge.source.id === nodeId || edge.target.id === nodeId
        );
        return {
          edges: getSampledEdges(allEdges),
          total: allEdges.length,
        };
      }
      return getPagedEdges(nodeId, edgePage);
    },
    [data.edges, edgeDisplayMode, edgePage, getPagedEdges, getSampledEdges]
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
            {/* Controls */}
            <div className="card bg-dark border-secondary mb-4">
              <div className="card-header border-secondary">
                <h5 className="card-title mb-0">Graph Controls</h5>
              </div>
              <div className="card-body">
                {/* View Mode Selection */}
                <div className="mb-3">
                  <label className="form-label">View Mode</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                  >
                    <option value="distributed">Distributed (50k nodes)</option>
                    <option value="concentrated">
                      Concentrated (2 nodes, 100k edges)
                    </option>
                  </select>
                </div>

                {/* Edge Display Mode */}
                <div className="mb-3">
                  <label className="form-label">Edge Display</label>
                  <select
                    className="form-select bg-dark text-light border-secondary"
                    value={edgeDisplayMode}
                    onChange={(e) => setEdgeDisplayMode(e.target.value)}
                  >
                    <option value="sample">Sampled Edges</option>
                    <option value="all">All Edges (Paginated)</option>
                  </select>
                </div>

                {/* Search */}
                <div className="mb-3">
                  <label className="form-label">Search Nodes</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && filteredNodes.length > 0 && (
                    <div className="position-absolute w-100 mt-1 bg-dark border border-secondary rounded shadow-sm">
                      {filteredNodes.map((node) => (
                        <div
                          key={node.id}
                          className="p-2 border-bottom border-secondary hover-bg-secondary"
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
            </div>

            {/* Statistics */}
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
            {/* Graph Visualization */}
            <div className="card bg-dark border-secondary mb-3">
              <div className="card-header border-secondary">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Network Graph</h5>
                  <button
                    className="btn btn-outline-info"
                    onClick={() => setSelectedNode(null)}
                  >
                    Reset View
                  </button>
                </div>
              </div>
              <div className="card-body p-0" style={{ height: "50vh" }}>
                <Suspense
                  fallback={
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <div className="spinner-border text-info" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  }
                >
                  <SigmaGraph
                    data={data}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    loading={loading}
                    getSampledEdges={getSampledEdges}
                  />
                </Suspense>
              </div>
            </div>

            {/* Data Browser */}
            <DataBrowser
              selectedNode={selectedNode}
              getConnectedEdges={getConnectedEdges}
              edgeDisplayMode={edgeDisplayMode}
              edgePage={edgePage}
              setEdgePage={setEdgePage}
              edgesPerPage={EDGES_PER_PAGE}
              edgeFilters={edgeFilters}
              setEdgeFilters={setEdgeFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
