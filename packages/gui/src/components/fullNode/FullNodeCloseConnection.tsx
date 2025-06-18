import { useCloseFullNodeConnectionMutation } from '@chia-network/api-react';
import { useShowError } from '@chia-network/core';

type Props = {
  nodeId: string;
  children: (props: { onClose: () => void }) => JSX.Element;
};

export default function FullNodeCloseConnection(props: Props) {
  const { nodeId, children } = props;
  const showError = useShowError();
  const [closeConnection] = useCloseFullNodeConnectionMutation();

  async function handleClose() {
    try {
      await closeConnection({
        nodeId,
      }).unwrap();
    } catch (error) {
      showError(error);
    }
  }

  return children({
    onClose: handleClose,
  });
}
