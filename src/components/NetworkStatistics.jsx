import React from 'react';
import StatisticsCard from './StatisticsCard';

const NetworkStatistics = ({ data, statistics, selectedNode, getConnectedEdges }) => {
  return (
    <div>
      <h5 className="text-light mb-3">Network Statistics</h5>
      <StatisticsCard
        title="Total Nodes"
        value={data.nodes.length}
        icon="◉"
        color="text-info"
      />
      <StatisticsCard
        title="Total Connections"
        value={data.edges.length}
        icon="⟷"
        color="text-success"
      />
      <StatisticsCard
        title="Avg. Connections"
        value={statistics.avgConnections}
        icon="↔"
        color="text-warning"
      />
      <StatisticsCard
        title="Max Connections"
        value={statistics.maxConnections}
        icon="★"
        color="text-danger"
      />
      <StatisticsCard
        title="Isolated Nodes"
        value={statistics.isolatedNodes}
        icon="◌"
        color="text-secondary"
      />
      {selectedNode && (
        <StatisticsCard
          title="Selected Node Connections"
          value={getConnectedEdges(selectedNode.id).length}
          icon="◎"
          color="text-primary"
        />
      )}
    </div>
  );
};

export default NetworkStatistics;