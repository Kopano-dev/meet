import { createSelector } from 'reselect';

import { getCurrentChannelChatsSession } from './chats';

export const getMainBadgeVisibility = createSelector(
  [ getCurrentChannelChatsSession ],
  (channelChatsSession) => {
    if (!channelChatsSession) {
      return false;
    }

    return channelChatsSession.unreadCount > 0;
  }
);
