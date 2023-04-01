import NotificationType from '../constants/NotificationType';
import parseNotification from './parseNotification';

describe('parseNotification', () => {
  test('parses OFFER notification', () => {
    const message = JSON.stringify({
      t: NotificationType.OFFER,
      v: 1,
      d: {
        ph: 'abcdefgh12345678',
        u: 'https://example.com/offer',
      },
    });

    const result = parseNotification(message);

    expect(result).toEqual({
      type: NotificationType.OFFER,
      version: 1,
      data: {
        url: 'https://example.com/offer',
        puzzleHash: 'abcdefgh12345678',
      },
    });
  });

  test('parses COUNTER_OFFER notification', () => {
    const message = JSON.stringify({
      t: NotificationType.COUNTER_OFFER,
      v: 1,
      d: {
        ph: 'abcdefgh12345678',
        u: 'https://example.com/counter-offer',
      },
    });

    const result = parseNotification(message);

    expect(result).toEqual({
      type: NotificationType.COUNTER_OFFER,
      version: 1,
      data: {
        url: 'https://example.com/counter-offer',
        puzzleHash: 'abcdefgh12345678',
      },
    });
  });

  test('parses notification with default type', () => {
    const message = JSON.stringify({
      v: 1,
      d: {
        ph: 'abcdefgh12345678',
        u: 'https://example.com/default',
      },
    });

    const result = parseNotification(message);

    expect(result).toEqual({
      type: 1, // The default type
      version: 1,
      data: {
        url: 'https://example.com/default',
        puzzleHash: 'abcdefgh12345678',
      },
    });
  });

  test('parses notification with missing type field', () => {
    const message = JSON.stringify({
      v: 1,
      d: {
        ph: 'abcdefgh12345678',
        u: 'https://example.com/default',
      },
    });

    const result = parseNotification(message);

    expect(result).toEqual({
      type: 1, // The default type
      version: 1,
      data: {
        url: 'https://example.com/default',
        puzzleHash: 'abcdefgh12345678',
      },
    });
  });

  test('parses notification with missing version field', () => {
    const message = JSON.stringify({
      t: NotificationType.OFFER,
      d: {
        ph: 'abcdefgh12345678',
        u: 'https://example.com/offer',
      },
    });

    const result = parseNotification(message);

    expect(result).toEqual({
      type: NotificationType.OFFER,
      version: 1, // The default version
      data: {
        url: 'https://example.com/offer',
        puzzleHash: 'abcdefgh12345678',
      },
    });
  });

  test('throws error for unknown notification type', () => {
    const message = JSON.stringify({
      t: 999,
      v: 1,
      d: {
        ph: 'abcdefgh12345678',
        u: 'https://example.com/unknown',
      },
    });

    expect(() => parseNotification(message)).toThrowError('Unknown notification type: 999');
  });

  test('throws error for invalid JSON input', () => {
    const message = 'invalid';

    expect(() => parseNotification(message)).toThrowError();
  });
});
