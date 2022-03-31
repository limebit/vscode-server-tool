import { useEffect, useReducer } from "react";

export const useDockerLogs = (containerId: string) => {
  const [logs, updateLogs] = useReducer(
    (currentLog: string[], update: string): string[] => {
      return [...currentLog, update];
    },
    []
  );
  const [reconnect, dispatchReconnect] = useReducer(() => ({}), {});

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/api/ws");

    ws.onopen = () => {
      ws.send(containerId);
    };

    ws.onmessage = async (e) => {
      updateLogs(await e.data.text());
    };

    ws.onclose = (e) => {
      if (!e.wasClean) {
        ("Websocket connection cloes. Reconnecting...");
      }
      setTimeout(dispatchReconnect, 1000);
    };

    return () => ws.close();
  }, [containerId, reconnect]);

  return logs;
};
