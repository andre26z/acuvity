import React, { useState, useEffect } from "react";

interface Node {
  id: string;
  name: string;
}

interface Edge {
  source: Node;
  target: Node;
  timestamp: string;
  metric1: number;
  metric2: number;
  weight: number;
}

interface HighVolumeData {
  metrics: Edge[];
  summary: {
    totalConnections: number;
    averageMetric1: string;
    averageMetric2: string;
    averageWeight: string;
    timeRange: {
      start: string;
      end: string;
    };
  };
}

interface DataBrowserProps {
  selectedNode: Node | null;
  getConnectedEdges: (nodeId: string) => Edge[];
}

interface DataFlowItemProps {
  edge: Edge;
  direction: "incoming" | "outgoing";
}

interface HighVolumeSummaryProps {
  summary: HighVolumeData["summary"];
}

const DataBrowser: React.FC<DataBrowserProps> = ({
  selectedNode,
  getConnectedEdges,
}) => {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">(
    "incoming"
  );
  const [displayCount, setDisplayCount] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showHighVolume, setShowHighVolume] = useState<boolean>(false);
  const [highVolumeData, setHighVolumeData] = useState<HighVolumeData | null>(
    null
  );
  const [sampleSize, setSampleSize] = useState<number>(20);

  // Reset states when selected node changes
  useEffect(() => {
    setDisplayCount(5);
    setShowHighVolume(false);
    setHighVolumeData(null);
    setSampleSize(20);
  }, [selectedNode?.id]);

  // Reset display count when tab changes
  useEffect(() => {
    setDisplayCount(5);
  }, [activeTab]);

  const generateHighVolumeData = (): HighVolumeData => {
    const mockMetrics: Edge[] = Array.from({ length: 100000 }, (_, index) => ({
      timestamp: new Date(
        Date.now() - Math.random() * 10000000000
      ).toISOString(),
      metric1: Math.random() * 1000,
      metric2: Math.random() * 10000,
      weight: Math.random() * 100,
      source: { id: "node1", name: "High Volume Source" },
      target: { id: "node2", name: "High Volume Target" },
    }));

    const summary = {
      totalConnections: mockMetrics.length,
      averageMetric1: (
        mockMetrics.reduce((acc, curr) => acc + curr.metric1, 0) /
        mockMetrics.length
      ).toFixed(2),
      averageMetric2: (
        mockMetrics.reduce((acc, curr) => acc + curr.metric2, 0) /
        mockMetrics.length
      ).toFixed(2),
      averageWeight: (
        mockMetrics.reduce((acc, curr) => acc + curr.weight, 0) /
        mockMetrics.length
      ).toFixed(2),
      timeRange: {
        start: new Date(
          Math.min(...mockMetrics.map((m) => new Date(m.timestamp).getTime()))
        ).toLocaleString(),
        end: new Date(
          Math.max(...mockMetrics.map((m) => new Date(m.timestamp).getTime()))
        ).toLocaleString(),
      },
    };

    return { metrics: mockMetrics, summary };
  };

  const handleLoadHighVolume = (): void => {
    setIsLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      const data = generateHighVolumeData();
      setHighVolumeData(data);
      setShowHighVolume(true);
      setIsLoading(false);
    }, 500);
  };

  const handleLoadMore = (): void => {
    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 20);
      setIsLoading(false);
    }, 300);
  };

  const handleLoadMoreSamples = (): void => {
    setIsLoading(true);
    setTimeout(() => {
      setSampleSize((prev) => Math.min(prev + 50, 1000)); // Limit to 1000 samples max
      setIsLoading(false);
    }, 300);
  };

  if (!selectedNode) {
    return (
      <div className="card bg-dark border-secondary">
        <div className="card-body text-center text-light p-4">
          <p>Select a node to view data flow details</p>
        </div>
      </div>
    );
  }

  const connectedEdges = getConnectedEdges(selectedNode.id);
  const incomingEdges = connectedEdges.filter(
    (edge) => edge.target.id === selectedNode.id
  );
  const outgoingEdges = connectedEdges.filter(
    (edge) => edge.source.id === selectedNode.id
  );

  const currentEdges = activeTab === "incoming" ? incomingEdges : outgoingEdges;
  const displayedEdges = currentEdges.slice(0, displayCount);
  const hasMore = displayCount < currentEdges.length;

  const DataFlowItem: React.FC<DataFlowItemProps> = ({ edge, direction }) => (
    <div
      className="border border-secondary rounded p-3 mb-2"
      style={{ background: "#1a1b26" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          {direction === "incoming" ? (
            <span className="text-warning">↓</span>
          ) : (
            <span className="text-info">↑</span>
          )}
          <span className="text-light">
            {direction === "incoming" ? edge.source.name : edge.target.name}
          </span>
        </div>
        <div className="d-flex align-items-center gap-1 text-light">
          <span>🕒</span>
          <span className="small text-white">
            {new Date(edge.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-4">
          <div className="d-flex flex-column">
            <span className="text-light small">Metric 1</span>
            <span className="text-light fw-medium">
              {edge.metric1.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="col-4">
          <div className="d-flex flex-column">
            <span className="text-light small">Metric 2</span>
            <span className="text-light fw-medium">
              {edge.metric2.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="col-4">
          <div className="d-flex flex-column">
            <span className="text-light small">Weight</span>
            <span className="text-light fw-medium">
              {edge.weight.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const HighVolumeSummary: React.FC<HighVolumeSummaryProps> = ({ summary }) => (
    <div
      className="border border-secondary rounded p-4 mb-3"
      style={{ background: "#1a1b26" }}
    >
      <h6 className="text-light mb-3">High Volume Connection Summary</h6>
      <div className="row g-3">
        <div className="col-6 col-md-3">
          <div className="d-flex flex-column">
            <span className="text-light small">Total Connections</span>
            <span className="text-light fw-medium">
              {summary.totalConnections.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="d-flex flex-column">
            <span className="text-light small">Avg Metric 1</span>
            <span className="text-light fw-medium">
              {summary.averageMetric1}
            </span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="d-flex flex-column">
            <span className="text-light small">Avg Metric 2</span>
            <span className="text-light fw-medium">
              {summary.averageMetric2}
            </span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="d-flex flex-column">
            <span className="text-light small">Avg Weight</span>
            <span className="text-light fw-medium">
              {summary.averageWeight}
            </span>
          </div>
        </div>
        <div className="col-12">
          <div className="d-flex flex-column">
            <span className="text-light small">Time Range</span>
            <span className="text-light fw-medium">
              {summary.timeRange.start} - {summary.timeRange.end}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="card bg-dark border-secondary">
      <div className="card-header border-secondary">
        <h5 className="card-title text-light mb-0">
          Data Flow Browser - {selectedNode.name}
        </h5>
      </div>
      <div className="card-body">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button
            className={`btn flex-grow-1 ${
              activeTab === "incoming" ? "btn-warning" : "btn-outline-warning"
            }`}
            onClick={() => {
              setActiveTab("incoming");
              setShowHighVolume(false);
            }}
          >
            Incoming Data ({incomingEdges.length})
          </button>
          <button
            className={`btn flex-grow-1 ${
              activeTab === "outgoing" ? "btn-info" : "btn-outline-info"
            }`}
            onClick={() => {
              setActiveTab("outgoing");
              setShowHighVolume(false);
            }}
          >
            Outgoing Data ({outgoingEdges.length})
          </button>
          <button
            className={`btn btn-outline-success w-100 ${
              showHighVolume ? "active" : ""
            }`}
            onClick={handleLoadHighVolume}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load High Volume Data (100k lines)"}
          </button>
        </div>

        <div
          className="tab-content"
          style={{
            height: "630px", // Fixed height
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: "5px", // Add some padding for the scrollbar
          }}
        >
          {showHighVolume && highVolumeData ? (
            <>
              <HighVolumeSummary summary={highVolumeData.summary} />
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-light mb-0">Sample Connections</h6>
                </div>

                {highVolumeData.metrics
                  .slice(0, sampleSize)
                  .map((edge, index) => (
                    <DataFlowItem
                      key={`high-volume-${index}`}
                      edge={edge}
                      direction={activeTab}
                    />
                  ))}
                <span className="text-light small">
                  Showing {sampleSize} of {highVolumeData.metrics.length}{" "}
                  connections
                </span>
                {sampleSize < 1000 && (
                  <div className="text-center py-3">
                    <button
                      className="btn btn-outline-success"
                      onClick={handleLoadMoreSamples}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Loading..."
                        : `Load More Samples (50 more, up to 1000 max)`}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : currentEdges.length === 0 ? (
            <div className="text-center text-light py-4">
              No {activeTab} data connections
            </div>
          ) : (
            <>
              {displayedEdges.map((edge, index) => (
                <DataFlowItem
                  key={`${activeTab}-${index}-${edge.source.id}-${edge.target.id}`}
                  edge={edge}
                  direction={activeTab}
                />
              ))}
              {hasMore && (
                <div className="text-center py-3">
                  <button
                    className={`btn ${
                      activeTab === "incoming"
                        ? "btn-outline-warning"
                        : "btn-outline-info"
                    }`}
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Loading..."
                      : `Load More (${
                          currentEdges.length - displayCount
                        } remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataBrowser;
