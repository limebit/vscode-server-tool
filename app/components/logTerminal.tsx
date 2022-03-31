import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import * as React from "react";
import { useDockerLogs } from "../hooks/use-docker-logs";

interface LogTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  containerId: string;
}

export const LogTerminal = ({
  isOpen,
  onClose,
  containerId,
}: LogTerminalProps) => {
  const logs = useDockerLogs(containerId);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    ref.current?.scrollIntoView();
  }, [logs]);

  return (
    <Modal onClose={onClose} isOpen={isOpen} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Logs</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            overflowY="scroll"
            backgroundColor="black"
            color="white"
            height="600px"
            width="100%"
            padding="15px"
          >
            {logs.map((log, i) => (
              <p key={i}>{log}</p>
            ))}
            <div ref={ref} />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
