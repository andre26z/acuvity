import React, { useState, useRef, useEffect } from "react";

const DataBrowser = ({ selectedNode, getConnectedEdges }) => {
  const [activeTab, setActiveTab] = useState("incoming");
  const [displayCount, setDisplayCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Reset display count when selected node changes
  useEffect(() => {
    setDisplayCount(5);
  }, [selectedNode?.id]);

  // Reset display count when tab changes
  useEffect(() => {
    setDisplayCount(5);
  }, [activeTab]);

  const handleLoadMore = () => {
    setIsLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      setDisplayCount((prev) => prev + 20);
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

  const DataFlowItem = ({ edge, direction }) => (
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

  return (
    <div className="card bg-dark border-secondary">
      <div className="card-header border-secondary">
        <h5 className="card-title text-light mb-0">
          Data Flow Browser - {selectedNode.name}
        </h5>
      </div>
      <div className="card-body">
        <div className="d-flex mb-3">
          <button
            className={`btn flex-grow-1 me-2 ${
              activeTab === "incoming" ? "btn-warning" : "btn-outline-warning"
            }`}
            onClick={() => setActiveTab("incoming")}
          >
            Incoming Data ({incomingEdges.length})
          </button>
          <button
            className={`btn flex-grow-1 ${
              activeTab === "outgoing" ? "btn-info" : "btn-outline-info"
            }`}
            onClick={() => setActiveTab("outgoing")}
          >
            Outgoing Data ({outgoingEdges.length})
          </button>
        </div>
        <div
          className="tab-content"
          style={{
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {currentEdges.length === 0 ? (
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
