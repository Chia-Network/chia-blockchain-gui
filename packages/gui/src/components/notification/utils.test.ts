import {
  createNotificationOfferData,
  createNotificationPayload,
  createOfferNotificationPayload,
  parseNotificationPayload,
  parseNotificationOfferData,
  NotificationTypeId,
} from './utils';

describe('Notification functions', () => {
  const offerURL = 'https://example.com/offer';
  const puzzleHash = 'abcdefgh12345678';

  test('createNotificationOfferData', () => {
    const offerData = createNotificationOfferData({ offerURL, puzzleHash });
    expect(offerData).toEqual({ u: offerURL, ph: puzzleHash });

    const offerDataNoPuzzleHash = createNotificationOfferData({ offerURL });
    expect(offerDataNoPuzzleHash).toEqual({ u: offerURL });
  });

  test('createNotificationPayload', () => {
    const data = { u: offerURL };
    const payload = createNotificationPayload(NotificationTypeId.OFFER, data);
    const parsedPayload = JSON.parse(payload);

    expect(parsedPayload).toMatchObject({
      v: 1,
      t: NotificationTypeId.OFFER,
      d: data,
    });
  });

  test('createOfferNotificationPayload', () => {
    const payload = createOfferNotificationPayload({ offerURL, puzzleHash });
    const parsedPayload = JSON.parse(payload);

    expect(parsedPayload).toMatchObject({
      v: 1,
      t: NotificationTypeId.OFFER,
      d: { u: offerURL, ph: puzzleHash },
    });
  });

  test('parseNotificationPayload', () => {
    const payload = createOfferNotificationPayload({ offerURL, puzzleHash });
    const parsedPayload = parseNotificationPayload(payload);

    expect(parsedPayload).toEqual({
      type: NotificationTypeId.OFFER,
      data: { u: offerURL, ph: puzzleHash },
    });

    // Test for invalid version
    const invalidVersionPayload = JSON.stringify({ v: 2, t: NotificationTypeId.OFFER, d: { u: offerURL } });
    expect(parseNotificationPayload(invalidVersionPayload)).toBeNull();

    expect(parseNotificationPayload('invalid')).toBeNull();
  });

  test('parseNotificationOfferData', () => {
    const payload = createOfferNotificationPayload({ offerURL, puzzleHash });
    const offerData = parseNotificationOfferData(payload);

    expect(offerData).toEqual({ u: offerURL, ph: puzzleHash });

    // Test for non-OFFER type
    const nonOfferTypePayload = JSON.stringify({ v: 1, t: 999, d: { u: offerURL } });
    expect(parseNotificationOfferData(nonOfferTypePayload)).toBeNull();

    // Test for missing 'u' field
    const missingUFieldPayload = JSON.stringify({ v: 1, t: NotificationTypeId.OFFER, d: { ph: puzzleHash } });
    const parsedMissingUField = parseNotificationOfferData(missingUFieldPayload);
    expect(parsedMissingUField).toEqual({ u: '', ph: puzzleHash });

    expect(parseNotificationOfferData('invalid')).toBeNull();
  });
});
