import { usePrefs } from '@chia-network/api-react';

export default function useNotificationSettings() {
  const [globalNotifications, setGlobalNotifications] = usePrefs<boolean>('globalNotifications', true);
  const [pushNotifications, setPushNotifications] = usePrefs<boolean>('pushNotifications', true);
  const [dappOfferNotifications, setDappOfferNotifications] = usePrefs<boolean>('dappOffersNotifications', true);
  const [dappAnnouncementNotifications, setDappAnnouncementNotifications] = usePrefs<boolean>(
    'dappAnnouncementNotifications',
    true
  );

  return {
    globalNotifications,
    setGlobalNotifications,

    pushNotifications,
    setPushNotifications,

    dappOfferNotifications,
    setDappOfferNotifications,

    dappAnnouncementNotifications,
    setDappAnnouncementNotifications,
  };
}
