import { WcError, WcErrorCode } from '../../@types/WcError';

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
  it('commits allowance usage AFTER the daemon responds successfully', async () => {
    // Committing before dispatch lets a hostile dapp drain the allowance with
    // daemon-rejectable requests. The order must be: send → success → commit.
    const order: string[] = [];
    const commit = jest.fn(() => order.push('commit'));
    const deps = makeDeps({ kind: 'allow', commit });
    deps.sendDappAndAwait.mockImplementationOnce(async () => {
      order.push('send');
      return { data: { success: true, transactionId: 'abc' } };
    });

    const out = await dispatchDaemonCommandAsPair(baseInput, deps);

    expect(out).toEqual({ data: { success: true, transactionId: 'abc' } });
    expect(order).toEqual(['send', 'commit']);
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

  it('does NOT commit when the daemon returns an application error', async () => {
    // Daemon errors come back as `response.data.error`, not a thrown exception.
    // Treating them as success would let an attacker spam rejected requests
    // to drain the user's allowance.
    const commit = jest.fn();
    const deps = makeDeps(
      { kind: 'allow', commit },
      {
        sendDappAndAwait: jest.fn(async () => ({ data: { success: false, error: 'fee too low' } })),
      },
    );

    await dispatchDaemonCommandAsPair(baseInput, deps);

    expect(commit).not.toHaveBeenCalled();
  });

  it('does NOT commit when the daemon dispatch throws (transport error)', async () => {
    const commit = jest.fn();
    const deps = makeDeps(
      { kind: 'allow', commit },
      {
        sendDappAndAwait: jest.fn(async () => {
          throw new Error('socket closed');
        }),
      },
    );

    await expect(dispatchDaemonCommandAsPair(baseInput, deps)).rejects.toThrow('socket closed');
    expect(commit).not.toHaveBeenCalled();
  });

  it('uses alias-specific defaults for alternate WC commands', async () => {
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

async function captureRejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error('expected rejection');
}

describe('dispatchDaemonCommandAsPair - dapp param validation', () => {
  // Validation runs before permission and dispatch — fails closed.

  it('rejects an unknown wc command before any other work', async () => {
    const deps = makeDeps({ kind: 'allow', commit: jest.fn() });
    const e = await captureRejection(
      dispatchDaemonCommandAsPair({ ...baseInput, wcCommand: 'chia_definitelyNotReal' }, deps),
    );
    expect(e).toBeInstanceOf(WcError);
    expect((e as WcError).code).toBe(WcErrorCode.METHOD_NOT_FOUND);
    expect((e as WcError).message).toBe('unknown wc command: chia_definitelyNotReal');
    expect(deps.resolvePermission).not.toHaveBeenCalled();
    expect(deps.sendDappAndAwait).not.toHaveBeenCalled();
  });

  it('rejects a payload key that is not declared in the schema', async () => {
    const deps = makeDeps({ kind: 'allow', commit: jest.fn() });
    const e = await captureRejection(
      dispatchDaemonCommandAsPair(
        {
          ...baseInput,
          data: { amount: '1', fee: '0', address: 'txch1abc', evil_extra: true },
        },
        deps,
      ),
    );
    expect(e).toBeInstanceOf(WcError);
    expect((e as WcError).code).toBe(WcErrorCode.INVALID_PARAMS);
    expect((e as WcError).message).toBe('param not allowed for dapp: evil_extra');
    expect(deps.resolvePermission).not.toHaveBeenCalled();
    expect(deps.sendDappAndAwait).not.toHaveBeenCalled();
  });

  it('rejects camelCase keys not in the schema (validation runs after snake-casing)', async () => {
    const deps = makeDeps({ kind: 'allow', commit: jest.fn() });
    await expect(
      dispatchDaemonCommandAsPair(
        {
          ...baseInput,
          wcCommand: 'chia_mintBulk',
          data: { walletId: 1, evilExtra: true },
        },
        deps,
      ),
    ).rejects.toThrow('param not allowed for dapp: evil_extra');
  });
});

describe('dispatchDaemonCommandAsPair - handler routing', () => {
  function makeHandlerDeps(decision: Decision, overrides: Partial<DispatchAsPairDeps> = {}) {
    return makeDeps(decision, {
      getDappHandler: jest.fn(),
      dispatchDaemon: jest.fn(),
      ...overrides,
    });
  }

  const handlerInput = {
    ...baseInput,
    wcCommand: 'chia_addCATToken',
    data: { asset_id: 'abc', name: 'Test CAT' },
    mainWindow: {} as never,
    pair: { topic: 'topic-1', metadata: { name: 'Test Dapp' } } as never,
  };

  it('invokes the registered handler instead of the daemon', async () => {
    const handler = jest.fn(async () => ({ data: { success: true, walletId: 5 } }));
    const deps = makeHandlerDeps({ kind: 'allow', commit: jest.fn() }, {
      getDappHandler: jest.fn((key: string) => (key === 'addCATToken' ? handler : undefined)),
    });

    const out = await dispatchDaemonCommandAsPair(handlerInput, deps);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ data: { success: true, walletId: 5 } });
    expect(deps.sendDappAndAwait).not.toHaveBeenCalled();
  });

  it('throws when the handler key has no registered implementation', async () => {
    const deps = makeHandlerDeps({ kind: 'allow', commit: jest.fn() }, {
      getDappHandler: jest.fn(() => undefined),
    });

    await expect(dispatchDaemonCommandAsPair(handlerInput, deps)).rejects.toThrow(
      'no handler registered for addCATToken',
    );
    expect(deps.sendDappAndAwait).not.toHaveBeenCalled();
  });

  it('still runs validation + permission gate before the handler', async () => {
    const handler = jest.fn();
    const deps = makeHandlerDeps({ kind: 'allow', commit: jest.fn() }, {
      getDappHandler: jest.fn(() => handler),
    });

    await expect(
      dispatchDaemonCommandAsPair(
        {
          ...handlerInput,
          data: { asset_id: 'abc', name: 'Test', evil_extra: true },
        },
        deps,
      ),
    ).rejects.toThrow('param not allowed for dapp: evil_extra');
    expect(handler).not.toHaveBeenCalled();
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
