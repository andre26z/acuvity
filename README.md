# Network Graph Visualization Project

## Overview

This project demonstrates an interactive network graph visualization solution designed to handle large-scale node-edge relationships with extensive metadata. The implementation focuses on providing an intuitive user interface for exploring complex network data while maintaining performance and responsiveness.

## Project Requirements

### Data Structure
- Input: JSONL format with 1000+ columns
- Core attributes: source node, destination node
- Additional attributes: ~998 metrics/attributes per edge
- Scale: 
  - Up to 100k edges
  - Node count varies from 2 to 50k nodes
  - Edge distribution can be highly concentrated or evenly spread

### Key Requirements
1. Graph visualization
2. Data browser for node details
3. Focus on:
   - User Experience
   - Responsiveness
   - Aesthetics
   - Data management
   - Code quality

## Solution Architecture

### Technology Stack
- **React**: Core framework for building the UI
- **ChartJS**: Lightweight charting library for visualization
- **Bootstrap**: Responsive design framework
- **CSS**: Custom styling with dark theme

### Core Components
1. **GraphVisualization**: Main container component
2. **NetworkStatistics**: Statistics panel component
3. **Scatter Plot**: Interactive node visualization
4. **Data Browser**: Edge details viewer

## Features

### 1. Interactive Graph View
- Scatter plot visualization of nodes
- Interactive node selection
- Visual highlighting of selected nodes
- Connection lines display on node selection
- Zoom and pan capabilities

### 2. Search & Navigation
- Real-time node search functionality
- Scrollable search results
- Click-to-focus node selection

### 3. Data Browser
- Split view of incoming/outgoing connections
- Detailed edge metrics display
- Scrollable data view for large datasets

### 4. Network Statistics
- Average connections
- Maximum connections
- Isolated nodes count
- Real-time updates

### 5. Responsive Design
- **Desktop View** (≥760px):
  - Sidebar with controls and statistics
  - Main graph view
  - Node details panel
- **Mobile View** (<760px):
  - Full-width graph
  - Condensed node details
  - Statistics panel below
  - Hidden search controls

## Data Management

### State Management
```javascript
const [data, setData] = useState({ nodes: [], edges: [] });
const [selectedNode, setSelectedNode] = useState(null);
const [filteredNodes, setFilteredNodes] = useState([]);
```

### Data Processing
- Node position calculation
- Edge relationship mapping
- Metric aggregation
- Real-time filtering

## User Experience Considerations

### 1. Visual Design
- Dark theme for reduced eye strain
- Clear visual hierarchy
- Consistent color coding
- Interactive elements with hover states

### 2. Performance Optimizations
- Lazy loading of data
- Efficient filtering algorithms
- Throttled search updates
- Optimized rendering cycles

### 3. Accessibility
- Keyboard navigation
- Screen reader support
- Clear visual feedback
- Responsive text sizing

## Code Quality

### 1. Component Structure
- Clear separation of concerns
- Modular design
- Reusable components
- Consistent naming conventions

## Technical Decisions & Tradeoffs

### Why ChartJS?
- Lightweight and performant
- Easy to customize
- Good documentation
- Active community

### Why Bootstrap?
- Rapid development
- Built-in responsive design
- Consistent component styling
- Extensive utility classes

### Performance vs Features
- Focused on core functionality first
- Implemented performance optimizations
- Room for feature expansion
- Maintainable codebase

## Summary

This solution addresses the challenge of visualizing and exploring large-scale network data through:
1. Interactive visualization
2. Efficient data management
3. Responsive design
4. Clean code architecture
5. Scalable feature set

The implementation provides a solid foundation for handling both extreme cases (2 nodes with 100k edges or 50k nodes with distributed edges) while maintaining good performance and user experience.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License
