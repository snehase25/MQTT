/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import * as go from "gojs";
import { ClientsData, NodeData } from "../../api/service";

interface GoJSTopologyDiagramProps {
  data: NodeData[];
}

const GoJSTopologyDiagram: React.FC<GoJSTopologyDiagramProps> = (props) => {
  const [clientMetrics, setClientMetrics] = useState<ClientsData | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const data = props.data;
  const diagramRef = useRef(null);
  const clientsDiagramRef = useRef(null);
  let myDiagram: go.Diagram | null = null;
  let distances: go.Map<go.Node, number> = new go.Map<go.Node, number>();

  // Create a separate diagram for clients data
  const [clientsDiagram, setClientsDiagram] = useState<go.Diagram | null>(null);

  // Function to fetch node metrics
  const fetchNodeMetrics = async (nodeName: string) => {
    const apiClientsUrl = `https://fine-fly-13.deno.dev/nodes/${nodeName}/clients`;

    try {
      const response = await fetch(apiClientsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${apiClientsUrl}`);
      }
      const data = await response.json();
      setClientMetrics(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    function init() {
      const $ = go.GraphObject.make;

      myDiagram = new go.Diagram(diagramRef.current, {
        initialAutoScale: go.Diagram.Uniform,
        contentAlignment: go.Spot.Center,
        layout: go.GraphObject.make(go.CircularLayout, {
          radius: 100, // Adjust the radius as needed
        }),
        maxSelectionCount: 2,
      });

      myDiagram.nodeTemplate = $(
        go.Node,
        "Horizontal",
        {
          locationSpot: go.Spot.Center,
          locationObjectName: "SHAPE",
          selectionAdorned: false,
          selectionChanged: nodeSelectionChanged,
          toolTip: $(
            go.Adornment,
            "Auto",
            $(go.Shape, { fill: "#FFFFCC" }),
            $(
              go.TextBlock,
              { margin: 4 },
              new go.Binding("text", "tooltipText")
            )
          ),
        },
        $(
          go.Panel,
          "Spot",
          $(
            go.Shape,
            "RoundedRectangle",
            {
              name: "SHAPE",
              fill: "lightgray",
              strokeWidth: 0,
              desiredSize: new go.Size(70, 30),
              portId: "",
            },
            new go.Binding("fill", "isSelected", (s, obj) =>
              s ? "orange" : obj.part.data.color
            ).ofObject()
          ),
          // $(
          //   go.TextBlock,
          //   new go.Binding("text", "distance", (d) =>
          //     d === Infinity ? "INF" : d | 0
          //   )
          // )
          $(go.TextBlock, new go.Binding("text"))
        )
        // $(go.TextBlock, new go.Binding("text"))
      );

      myDiagram.linkTemplate = $(
        go.Link,
        {
          selectable: false,
          curve: go.Link.Bezier, //Orthogonal
          layerName: "Background",
        },
        $(
          go.Shape,
          {
            isPanelMain: true,
            stroke: null,
            strokeWidth: 5,
          },
          new go.Binding("stroke", "isHighlighted", (h) =>
            h ? "red" : null
          ).ofObject()
        ),
        $(
          go.Shape,
          {
            isPanelMain: true,
            stroke: "black",
            strokeWidth: 1,
            toArrow: "Standard", // Add an arrow at the "to" end
            fromArrow: "Standard",
          },
          new go.Binding("stroke", "color")
        ),
        $(
          go.Shape,
          {
            toArrow: "Standard", // Add another arrow at the "from" end
            fromArrow: "Standard", // Add another arrow at the "
            scale: 1, // Adjust the scale as needed
          },
          new go.Binding("stroke", "color")
        )
      );

      generateGraph();
      // chooseTwoNodes();

      // Create a separate diagram for clients data
      let clientsDiagram: go.Diagram | null = null;

      clientsDiagram = new go.Diagram(clientsDiagramRef.current, {
        initialAutoScale: go.Diagram.Uniform,
        contentAlignment: go.Spot.Center,
        layout: go.GraphObject.make(go.ForceDirectedLayout, {
          defaultSpringLength: 30,
          maxIterations: 300,
        }),
        maxSelectionCount: 1,
      });

      clientsDiagram.nodeTemplate = $(
        go.Node,
        "Horizontal",
        {
          locationSpot: go.Spot.Center,
          locationObjectName: "SHAPE",
          selectionAdorned: false,
          selectionChanged: nodeSelectionChanged,
          toolTip: $(
            go.Adornment,
            "Auto",
            $(go.Shape, { fill: "#FFFFCC" }),
            $(
              go.TextBlock,
              { margin: 4 },
              new go.Binding("text", "tooltipText")
            )
          ),
        },
        $(
          go.Panel,
          "Spot",
          $(
            go.Shape,
            "Circle",
            {
              name: "SHAPE",
              fill: "lightblue",
              strokeWidth: 0,
              desiredSize: new go.Size(100, 100),
              portId: "",
            }
            // new go.Binding("fill", "isSelected", (s, obj) =>
            //   s ? "orange" : obj.part.data.color
            // ).ofObject()
          ),
          // $(
          //   go.TextBlock,
          //   new go.Binding("text", "distance", (d) =>
          //     d === Infinity ? "INF" : d | 0
          //   )
          // )
          $(go.TextBlock, new go.Binding("text"))
        )
        // $(go.TextBlock, new go.Binding("text"))
      );
      if (clientsDiagram) setClientsDiagram(clientsDiagram);
    }

    // Inside the generateGraph() function
    function generateGraph() {
      const nodeDataArray = data.map((node, index) => ({
        key: index,
        text: node.name,
        color: node.state.toLowerCase() === "running" ? "green" : "red",
        tooltipText: `State: ${node.state}\nConnected Clients: ${node.metrics.connectedClients}\nMessage Rate: ${node.metrics.msgSec}\nUptime: ${node.metrics.uptime}`,
      }));

      // Calculate the positions for circular layout
      const numNodes = nodeDataArray.length;

      const linkDataArray = [];

      if (numNodes > 1)
        for (let i = 0; i < numNodes; i++) {
          const from = i;
          const to = (i + 1) % numNodes;

          // Add a link from 'i' to '(i + 1) % numNodes'
          linkDataArray.push({
            from: from,
            to: to,
            color: "black", // go.Brush.randomColor(0, 127),
          });

          // Add a link from '(i + 1) % numNodes' to 'i' (reverse direction)
          linkDataArray.push({
            from: to,
            to: from,
            color: "black", // go.Brush.randomColor(0, 127),
          });
        }

      myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    }

    function nodeSelectionChanged(node: go.Node | null) {
      if (!node || !(node instanceof go.Node)) {
        return; // Ensure that 'node' is a valid 'Node' object
      }

      const diagram = node.diagram;
      if (!diagram) return;
      diagram.clearHighlighteds();
      if (node.isSelected) {
        const begin = diagram.selection.first() as go.Node;
        showDistances(begin);
        if (diagram.selection.count === 2) {
          const end = node as go.Node;
          highlightShortestPath(begin, end);
          listAllPaths(begin, end);
        }
      }
    }

    let paths;
    function listAllPaths(begin: go.Node, end: go.Node) {
      paths = collectAllPaths(begin, end);

      const sel = document.getElementById("myPaths") as HTMLSelectElement;
      if (sel) {
        sel.innerHTML = ""; // Clear out any old Option elements

        paths.each((path: go.List<go.Node>) => {
          const opt = document.createElement("option");
          opt.text = pathToString(path);
          sel.add(opt);
        });

        sel.onchange = highlightSelectedPath;
      }
    }

    function pathToString(path: go.List<go.Node>) {
      let s = `${path.count}: `;
      for (let i = 0; i < path.count; i++) {
        const node = path.get(i) as go.Node;
        if (i > 0) s += " -- ";
        s += node.data.text;
      }
      return s;
    }

    function highlightSelectedPath() {
      const sel = document.getElementById("myPaths") as HTMLSelectElement;
      highlightPath(paths.get(sel.selectedIndex));
    }

    function highlightPath(path: any) {
      myDiagram.clearHighlighteds();
      for (let i = 0; i < path.count - 1; i++) {
        const f = path.get(i);
        const t = path.get(i + 1);
        f.findLinksTo(t).each((l: go.Link) => (l.isHighlighted = true));
      }
    }

    function showDistances(begin: go.Node) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      distances = findDistances(begin);
      const it = distances.iterator;
      while (it.next()) {
        const n = it.key;
        const dist = it.value;
        myDiagram.model.setDataProperty(n.data, "distance", dist);
      }
    }

    function highlightShortestPath(begin, end) {
      highlightPath(findShortestPath(begin, end));
    }

    function findDistances(source: go.Node) {
      const diagram = source.diagram;
      const distances = new go.Map<go.Node, number>();

      diagram.nodes.each((n: go.Node) => {
        distances.set(n, Infinity);
      });

      distances.set(source, 0);

      const seen = new go.Set<go.Node>();
      seen.add(source);

      const finished = new go.Set<go.Node>();

      while (seen.count > 0) {
        const least = leastNode(seen, distances);
        const leastdist = distances.get(least);
        seen.delete(least);
        finished.add(least);

        const it = least.findLinksOutOf();
        while (it.next()) {
          const link = it.value;
          const neighbor = link.getOtherNode(least);

          if (finished.has(neighbor)) continue;

          const neighbordist = distances.get(neighbor);
          const dist = leastdist + 1;

          if (dist < neighbordist) {
            if (neighbordist === Infinity) {
              seen.add(neighbor);
            }
            distances.set(neighbor, dist);
          }
        }
      }

      return distances;
    }

    function leastNode(
      coll: go.Set<go.Node>,
      distances: go.Map<go.Node, number>
    ) {
      let bestdist = Infinity;
      let bestnode: go.Node | null = null;
      const it = coll.iterator;

      while (it.next()) {
        const n = it.value;
        const dist = distances.get(n);

        if (dist < bestdist) {
          bestdist = dist;
          bestnode = n;
        }
      }

      return bestnode;
    }
    function findShortestPath(begin: any, end: any) {
      // compute and remember the distance of each node from the BEGIN node
      const distances = findDistances(begin);

      // now find a path from END to BEGIN, always choosing the adjacent Node with the lowest distance
      const path = new go.List();
      path.add(end);
      while (end !== null) {
        let next = leastNode(end.findNodesInto() as any, distances);
        if (next !== null) {
          if (distances.get(next) < distances.get(end)) {
            path.add(next); // making progress towards the beginning
          } else {
            next = null; // nothing better found -- stop looking
          }
        }
        end = next;
      }
      // reverse the list to start at the node closest to BEGIN that is on the path to END
      // NOTE: if there's no path from BEGIN to END, the first node won't be BEGIN!
      path.reverse();
      return path;
    }

    function collectAllPaths(begin: go.Node, end: go.Node) {
      const stack = new go.List<go.Node>();
      const coll = new go.List<go.List<go.Node>>();

      function find(source: go.Node, end: go.Node) {
        source.findNodesOutOf().each((n: go.Node) => {
          if (n === source) return;
          if (n === end) {
            const path = stack.copy();
            path.add(end);
            coll.add(path);
          } else if (!stack.contains(n)) {
            stack.add(n);
            find(n, end);
            stack.removeAt(stack.count - 1);
          }
        });
      }

      stack.add(begin);
      find(begin, end);
      return coll;
    }

    // Initialize the diagram when the component mounts
    init();

    // Add a click event handler for nodes
    if (myDiagram) {
      myDiagram.addDiagramListener(
        "ObjectSingleClicked",
        (e: go.DiagramEvent) => {
          const node = e.subject.part as go.Node;
          const nodeName = node.data.text;
          setSelectedNode(nodeName);
          fetchNodeMetrics(nodeName);
        }
      );
    }

    // Ensure that the diagram is destroyed when the component unmounts
    return () => {
      if (myDiagram !== null) {
        myDiagram.div = null;
        myDiagram = null;
      }

      if (clientsDiagram !== null) {
        setClientsDiagram(null);
        clientsDiagram.div = null;
        clientsDiagramRef.current = null;
      }
    };
  }, [data]);

  // Render the clients data diagram
  const renderClientsDiagram = () => {
    if (!clientsDiagram) {
      return null;
    }

    // Update the clients data diagram's model based on clientMetrics
    if (clientMetrics && clientMetrics?.clients.length > 0) {
      const clientNodeDataArray = clientMetrics.clients.map((client) => ({
        key: client.clientId,
        text: `Client ${client.clientId}`,
        category: "clientNode",
        tooltipText: `Client ID: ${client.clientId}\nClient IP: ${client.metaData?.clientIp}`,
      }));

      const clientLinkDataArray = clientMetrics.clients.map((client) => ({
        from: selectedNode,
        to: client.clientId,
        color: "blue",
      }));

      const clientsModel = new go.GraphLinksModel(
        clientNodeDataArray,
        clientLinkDataArray
      );

      clientsDiagram.model = clientsModel;
    }

    return (
      <div
        ref={clientsDiagramRef}
        style={{
          width: "100%",
          height: "500px", // Adjust the height as needed
          zIndex: 1,
          backgroundColor: "#e0ecff",
        }}
      ></div>
    );
  };

  return (
    <>
      <div>
        <div
          ref={diagramRef}
          style={{
            width: "100vw",
            height: "500px",
            zIndex: 1,
            backgroundColor: "#e0ecff",
            marginTop: "80px",
          }}
        ></div>
        {renderClientsDiagram()}
        <div className="client-metrics">
          <h2>
            Selected node:<b style={{ color: "#00d8fe" }}>{selectedNode}</b> -
            Number of running client(s):
            <b style={{ color: "#00d8fe" }}>{clientMetrics?.clients.length}</b>
          </h2>
          <div className="client-list">
            {clientMetrics && clientMetrics.clients.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Client Id</th>
                    <th>Client IP</th>
                  </tr>
                </thead>
                <tbody>
                  {clientMetrics.clients.map((client) => (
                    <tr key={client.clientId}>
                      <td>{client.clientId}</td>
                      <td>{client.metaData?.clientIp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No clients found</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GoJSTopologyDiagram;
