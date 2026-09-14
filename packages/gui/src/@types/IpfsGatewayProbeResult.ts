// The outcome of asking a gateway for a well-known file once, from the main
// process, when the user saves a gateway address: whether the host answered at
// all (any HTTP status counts — a slow or rate-limiting gateway is still the
// right address) and, when it did not, the network error that says why.
type IpfsGatewayProbeResult = {
  // the normalized gateway base that was probed
  gateway: string;
  reachable: boolean;
  // the HTTP status the gateway answered with, when it answered
  status?: number;
  // the network error when it did not
  error?: string;
};

export default IpfsGatewayProbeResult;
