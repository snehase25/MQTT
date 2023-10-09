interface Metrics {
  msgSec: number;
  uptime: number;
  connectedClients: number;
}

export interface NodeData {
  name: string;
  state: "RUNNING" | "ERROR";
  metrics: Metrics;
}

interface ClientMetaData {
  clientIp: string;
}

interface Client {
  clientId: string;
  metaData: ClientMetaData;
}

export interface ClientsData {
  clients: Client[];
}

export function useApiData(apiUrl: string) {
  const fetchData = async (): Promise<string | NodeData[]> => {
    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData: NodeData[] = await response.json();
      return responseData;
    } catch (error) {
      console.error("Error fetching data:", error);
      return "Error fetching data";
    }
  };

  return fetchData();
}
