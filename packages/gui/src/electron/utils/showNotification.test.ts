import NotificationType from '../../constants/NotificationType';
import type { DappCommandHandlerContext } from '../commands/Commands';

const mockSendNotification = jest.fn();

function makeContext(): DappCommandHandlerContext {
  return {
    fingerprint: 123_456,
    sendNotification: mockSendNotification,
    pair: {
      topic: 'topic-1',
      mainnet: true,
      metadata: {
        name: 'Test dApp',
      },
      fingerprint: 123_456,
      createdAt: 100,
      updatedAt: 100,
      commands: ['chia_showNotification'],
      bypass: [],
    },
  };
}

describe('showNotification', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123_456_789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends offer notifications to renderer subscribers for the authorized fingerprint', async () => {
    const { showNotification } = await import('./showNotification');

    await expect(
      showNotification(
        {
          type: NotificationType.OFFER,
          offer_data: 'offer-data',
        },
        makeContext(),
      ),
    ).resolves.toEqual({ success: true });

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.OFFER,
        timestamp: 1_700_000_000,
        id: 'wc-1700000000000-123456789',
        source: 'WALLET_CONNECT',
        from: 'Test dApp',
        fingerprints: [123_456],
        offerData: 'offer-data',
      }),
    );
  });

  it('sends announcement notifications to the paired fingerprint when all fingerprints are requested', async () => {
    const { showNotification } = await import('./showNotification');

    await showNotification(
      {
        type: NotificationType.ANNOUNCEMENT,
        message: 'Hello',
        url: 'https://example.com',
        all_fingerprints: true,
      },
      makeContext(),
    );

    expect(mockSendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.ANNOUNCEMENT,
        fingerprints: [123_456],
        message: 'Hello',
        url: 'https://example.com',
      }),
    );
  });

  it('sends each parsed notification once', async () => {
    const { showNotification } = await import('./showNotification');

    await showNotification(
      {
        type: NotificationType.ANNOUNCEMENT,
        message: 'Hello',
      },
      makeContext(),
    );

    expect(mockSendNotification).toHaveBeenCalledTimes(1);
  });
});
