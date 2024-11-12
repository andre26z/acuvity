import React, { useState } from "react";

const DataBrowser = ({ selectedNode, getConnectedEdges }) => {
  const [activeTab, setActiveTab] = useState("incoming");

  if (!selectedNode) {
    return (
      <div className="card bg-dark border-secondary">
        <div className="card-body text-center text-muted p-4">
          <p>Select a node to view data flow details</p>
        </div>
      </div>
    );
  }

  const incomingEdges = getConnectedEdges(selectedNode.id).filter(
    (edge) => edge.target.id === selectedNode.id
  );

  const outgoingEdges = getConnectedEdges(selectedNode.id).filter(
    (edge) => edge.source.id === selectedNode.id
  );

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
        <div className="d-flex align-items-center gap-1 text-muted">
          <span>🕒</span>
          <span className="small text-white">
            {new Date(edge.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-4">
          <div className="d-flex flex-column">
            <span className="text-muted small">Metric 1</span>
            <span className="text-light fw-medium">
              {edge.metric1.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="col-4">
          <div className="d-flex flex-column">
            <span className="text-muted small">Metric 2</span>
            <span className="text-light fw-medium">
              {edge.metric2.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="col-4">
          <div className="d-flex flex-column">
            <span className="text-muted small">Weight</span>
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
        {/* Custom Tabs */}
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

        {/* Tab Content */}
        <div
          className="tab-content"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {activeTab === "incoming" && (
            <div>
              {incomingEdges.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No incoming data connections
                </div>
              ) : (
                incomingEdges.map((edge, index) => (
                  <DataFlowItem key={index} edge={edge} direction="incoming" />
                ))
              )}
            </div>
          )}

          {activeTab === "outgoing" && (
            <div>
              {outgoingEdges.length === 0 ? (
                <div className="text-center text-muted py-4">
                  No outgoing data connections
                </div>
              ) : (
                outgoingEdges.map((edge, index) => (
                  <DataFlowItem key={index} edge={edge} direction="outgoing" />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataBrowser;
