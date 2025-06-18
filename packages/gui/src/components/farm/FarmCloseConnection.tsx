import { useCloseFarmerConnectionMutation } from '@chia-network/api-react';
import { useShowError } from '@chia-network/core';

type Props = {
  nodeId: string;
  children: (props: { onClose: () => void }) => JSX.Element;
};

export default function FarmCloseConnection(props: Props): JSX.Element {
  const { nodeId, children } = props;
  const showError = useShowError();
  const [closeFarmerConnection] = useCloseFarmerConnectionMutation();

  async function handleClose() {
    try {
      await closeFarmerConnection({ nodeId }).unwrap();
    } catch (error) {
      showError(error);
    }
  }

  return children({
    onClose: handleClose,
  });
}
