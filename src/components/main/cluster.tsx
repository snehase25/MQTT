/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from "react";
import Navbar from "../header/navbar";
import { NodeData, useApiData } from "../../api/service";
import GoJSTopologyDiagram from "./GoJSTopologyDiagram";

const apiNodesUrl = "https://fine-fly-13.deno.dev/nodes";

export const Cluster: React.FC = () => {
  const [data, setData] = useState<NodeData[] | string | null>([]);
  const [isLoading, setIsLoading] = useState(false);

  //To load data on first load
  useEffect(() => {
    fetchData();
  }, []);

  //Async function to load the data on button click on nav bar and first page load
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await useApiData(apiNodesUrl); // Use the hook directly here
      setData(result);
    } catch (error) {
      // Handle errors here, e.g., show an error message.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar onFetchDataClick={fetchData} />
      {isLoading ? (
        <p className="text-center">Loading...</p>
      ) : (
        typeof data === "object" && <GoJSTopologyDiagram data={data} />
      )}
    </div>
  );
};
