'use client';

import { useRef, useEffect, useState } from 'react';
import { Network } from 'vis-network';
import './NetworkGraph.css';

interface ClusterData {
  id: string;
  label: string;
  size: number;
  color: string;
  group: number;
}

interface EdgeData {
  from: string;
  to: string;
  width: number;
  value: number;
}

interface NetworkGraphProps {
  nodes: ClusterData[];
  edges: EdgeData[];
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, edges }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<ClusterData | null>(null);
  const [relatedNodes, setRelatedNodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Clean up previous network if it exists
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }

    setLoading(true);

    // Prepare data for vis.js
    const data = {
      nodes: nodes.map(node => ({
        id: node.id,
        label: node.label,
        value: node.size,
        title: `${node.label} (Group #${node.group})`,
        color: {
          background: `${node.color}30`,
          border: node.color,
          highlight: {
            background: `${node.color}50`,
            border: node.color
          },
          hover: {
            background: `${node.color}50`,
            border: node.color
          }
        },
        font: {
          color: 'white',
          size: Math.max(14, Math.min(22, 14 + (node.size / 5))),
          face: 'Rajdhani, sans-serif'
        },
        borderWidth: 2,
        borderWidthSelected: 4,
        shape: 'dot',
        size: Math.max(20, Math.min(50, 20 + node.size)),
        group: node.group
      })),
      edges: edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        width: edge.width,
        value: edge.value,
        color: {
          color: '#3e4c5a',
          highlight: '#63b0e3',
          hover: '#63b0e3',
          opacity: 0.8
        },
        smooth: {
          type: 'continuous'
        }
      }))
    };

    // Configure network options
    const options = {
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -5000,
          centralGravity: 0.3,
          springLength: 200,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.2
        },
        stabilization: {
          iterations: 100,
          updateInterval: 25,
          fit: true
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 300,
        zoomView: true,
        dragView: true,
        navigationButtons: false,
        keyboard: {
          enabled: true,
          bindToWindow: false
        },
        multiselect: false,
        selectable: true,
        hoverConnectedEdges: true,
        selectConnectedEdges: true
      },
      groups: {
        1: { color: { background: '#ff572220', border: '#ff5722' } },
        2: { color: { background: '#2196f320', border: '#2196f3' } },
        3: { color: { background: '#4caf5020', border: '#4caf50' } },
        4: { color: { background: '#9c27b020', border: '#9c27b0' } },
        5: { color: { background: '#ffc10720', border: '#ffc107' } }
      },
      layout: {
        improvedLayout: true,
        randomSeed: 42
      },
      nodes: {
        scaling: {
          min: 20,
          max: 50,
          label: {
            enabled: true,
            min: 14,
            max: 22
          }
        }
      },
      edges: {
        scaling: {
          min: 1,
          max: 5,
          label: {
            enabled: false
          }
        },
        smooth: {
          type: 'continuous',
          forceDirection: 'none'
        }
      }
    };

    // Initialize network
    try {
      // @ts-expect-error - vis-network typing issues
      networkRef.current = new Network(containerRef.current, data, options);

      // Add event listeners
      networkRef.current.on('click', function(params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
            
            // Find connected nodes
            const connectedNodes: string[] = [];
            edges.forEach(edge => {
              if (edge.from === nodeId) {
                connectedNodes.push(edge.to);
              } else if (edge.to === nodeId) {
                connectedNodes.push(edge.from);
              }
            });
            setRelatedNodes(connectedNodes);
          }
        } else {
          // Clicked on empty space
          setSelectedNode(null);
          setRelatedNodes([]);
        }
      });

      // Stabilize and fit network
      networkRef.current.once('stabilizationIterationsDone', function() {
        setLoading(false);
        networkRef.current?.fit({
          animation: {
            duration: 800,
            easingFunction: 'easeOutQuint'
          }
        });
      });
    } catch (error) {
      console.error('Error initializing network graph:', error);
      setLoading(false);
    }

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
      setSelectedNode(null);
      setRelatedNodes([]);
    };
  }, [nodes, edges]);

  // Find the related nodes information
  const relatedNodeInfo = relatedNodes.map(id => 
    nodes.find(node => node.id === id)
  ).filter(Boolean) as ClusterData[];

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <div className="text-cyan-400 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generating network graph...</span>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="network-container" />
      
      <div className="network-controls">
        <p>Hover over nodes to see details</p>
        <p>Click a node to see connections</p>
        <p>Scroll to zoom in/out</p>
      </div>
      
      {selectedNode && (
        <div className="absolute top-4 left-4 p-3 bg-gray-900/80 border border-gray-700 rounded-md text-sm max-w-xs">
          <h3 className="font-medium mb-2" style={{ color: selectedNode.color }}>
            {selectedNode.label}
          </h3>
          <div className="mb-2">
            <span className="text-gray-400">Group:</span> <span className="text-white">#{selectedNode.group}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-400">Size:</span> <span className="text-white">{selectedNode.size}</span>
          </div>
          {relatedNodeInfo.length > 0 && (
            <div>
              <span className="text-gray-400">Connected to:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {relatedNodeInfo.map(node => (
                  <span 
                    key={node.id}
                    className="px-2 py-1 text-xs rounded"
                    style={{ 
                      backgroundColor: `${node.color}30`, 
                      color: node.color,
                      border: `1px solid ${node.color}`
                    }}
                  >
                    {node.label}
                  </span>
                ))}
              </div>
            </div>
          )}
          <button 
            onClick={() => setSelectedNode(null)} 
            className="mt-3 px-2 py-1 bg-gray-800 text-gray-300 rounded-md text-xs hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph; 