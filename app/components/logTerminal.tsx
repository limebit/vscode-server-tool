import { Box } from "@chakra-ui/react";
import * as React from "react";
import { useDockerLogs } from "../hooks/use-docker-logs";

interface LogTerminalProps {
  containerId: string;
}

export const LogTerminal = ({ containerId }: LogTerminalProps) => {
  const logs = useDockerLogs(containerId);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <Box
      overflowY="scroll"
      backgroundColor="black"
      color="white"
      height="600px"
      width="100%"
      padding="15px"
      fontFamily="Courier New"
      ref={ref}
    >
      {logs.map((log, i) => (
        <p key={i}>{log}</p>
      ))}
    </Box>
  );
};
