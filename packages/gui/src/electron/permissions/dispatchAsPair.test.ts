import { dispatchDaemonCommandAsPair, type DispatchAsPairDeps } from './dispatchAsPair';
import type { Decision } from './types';

type TestDeps = Required<DispatchAsPairDeps> & {
  resolvePermission: jest.Mock;
  renderConfirm: jest.Mock;
  openConfirm: jest.Mock;
  captureBypassFromConfirmResult: jest.Mock;
  sendDappAndAwait: jest.Mock;
  requestId: jest.Mock;
};

const baseInput = {
  wcCommand: 'chia_sendTransaction',
  data: { address: 'txch1abc', amount: '100', fee: '2' },
  topic: 'topic-1',
  mainnet: true,
  fingerprint: { requested: 123 },
  networkPrefix: 'txch',
};

const rendered = {
  title: 'Confirm Send Transaction',
  message: 'Review',
  confirmLabel: 'Send',
  destructive: false,
  rows: [],
  display: undefined,
};

function makeDeps(decision: Decision, overrides: Partial<DispatchAsPairDeps> = {}): TestDeps {
  return {
    resolvePermission: jest.fn(async () => decision),
    renderConfirm: jest.fn(async () => rendered),
    openConfirm: jest.fn(async () => true),
    captureBypassFromConfirmResult: jest.fn(),
    sendDappAndAwait: jest.fn(async () => ({ data: { success: true, transactionId: 'abc' } })),
    requestId: jest.fn(() => 'request-1'),
    ...overrides,
  } as TestDeps;
}

function parseWire(deps: TestDeps) {
  const [, json] = deps.sendDappAndAwait.mock.calls[0];
  return JSON.parse(json as string) as Record<string, unknown>;
}

describe('dispatchDaemonCommandAsPair - auto-approved commands', () => {
  it('commits allowance usage before sending the daemon request and applies registry defaults', async () => {
    const order: string[] = [];
    const commit = jest.fn(() => order.push('commit'));
    const deps = makeDeps({ kind: 'allow', commit });
    deps.sendDappAndAwait.mockImplementationOnce(async () => {
      order.push('send');
      return { data: { success: true, transactionId: 'abc' } };
    });

    const out = await dispatchDaemonCommandAsPair(baseInput, deps);

    expect(out).toEqual({ data: { success: true, transactionId: 'abc' } });
    expect(order).toEqual(['commit', 'send']);
    expect(deps.openConfirm).not.toHaveBeenCalled();
    expect(deps.sendDappAndAwait).toHaveBeenCalledWith('request-1', expect.any(String));
    expect(parseWire(deps)).toMatchObject({
      origin: 'wallet_ui',
      destination: 'chia_wallet',
      command: 'send_transaction',
      data: {
        wallet_id: 1,
        address: 'txch1abc',
        amount: '100',
        fee: '2',
      },
      ack: false,
      request_id: 'request-1',
    });
  });

  it('uses alias-specific defaults for legacy WC commands', async () => {
    const deps = makeDeps({ kind: 'allow', commit: jest.fn() });

    await dispatchDaemonCommandAsPair(
      {
        ...baseInput,
        wcCommand: 'chia_getCurrentAddress',
        data: {},
      },
      deps,
    );

    expect(parseWire(deps)).toMatchObject({
      destination: 'chia_wallet',
      command: 'get_next_address',
      data: { wallet_id: 1, new_address: false },
    });
  });
});

describe('dispatchDaemonCommandAsPair - prompted commands', () => {
  it('opens confirm, captures bypass, and does not commit allowance usage', async () => {
    const deps = makeDeps(
      {
        kind: 'prompt',
        reason: 'spending needs confirmation',
        pair: { topic: 'topic-1', name: 'Test Dapp', url: 'https://example.com' },
      },
      {
        openConfirm: jest.fn(async () => ({ bypass: true })),
      },
    );

    await dispatchDaemonCommandAsPair(baseInput, deps);

    expect(deps.openConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'chia_wallet.send_transaction',
        data: { address: 'txch1abc', amount: '100', fee: '2' },
        principal: { kind: 'pair', name: 'Test Dapp', url: 'https://example.com' },
        showBypassToggle: true,
      }),
      { title: 'Confirm Send Transaction', width: 640, height: 600 },
    );
    expect(deps.captureBypassFromConfirmResult).toHaveBeenCalledWith(
      { bypass: true },
      { topic: 'topic-1', wcCommand: 'chia_sendTransaction' },
      expect.any(Object),
    );
  });

  it('throws when the user cancels the confirmation', async () => {
    const deps = makeDeps(
      { kind: 'prompt', reason: 'needs confirmation', pair: { topic: 'topic-1', name: 'Test Dapp' } },
      { openConfirm: jest.fn(async () => false) },
    );

    await expect(dispatchDaemonCommandAsPair(baseInput, deps)).rejects.toThrow('Operation cancelled by user');
    expect(deps.sendDappAndAwait).not.toHaveBeenCalled();
  });
});

describe('dispatchDaemonCommandAsPair - daemon response contract', () => {
  it('returns daemon application errors as result data instead of throwing generic JSON-RPC errors', async () => {
    const deps = makeDeps(
      { kind: 'allow', commit: jest.fn() },
      {
        sendDappAndAwait: jest.fn(async () => ({
          data: { success: false, error: "Coin ID's not found" },
        })),
      },
    );

    await expect(dispatchDaemonCommandAsPair(baseInput, deps)).resolves.toEqual({
      data: { success: false, error: "Coin ID's not found" },
    });
  });

  it('camel-cases successful daemon response data for dapps', async () => {
    const deps = makeDeps(
      { kind: 'allow', commit: jest.fn() },
      {
        sendDappAndAwait: jest.fn(async () => ({
          data: { transaction_id: 'abc', wallet_id: 1 },
        })),
      },
    );

    await expect(dispatchDaemonCommandAsPair(baseInput, deps)).resolves.toEqual({
      data: { transactionId: 'abc', walletId: 1 },
    });
  });
});
