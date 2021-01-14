import { createSelector } from 'reselect';

const getChannel = (state) => state.kwm.channel;
const getChatsTable = (state) => state.chats;

const getChatsSession = (state, channel, session) => {
  const chats = getChatsTable(state);

  const channelChats = chats[channel];
  if (!channelChats) {
    return null;
  }

  const channelChatsSession = channelChats[session];
  if (!channelChatsSession) {
    return null;
  }

  return channelChatsSession;
};

const noMessages = [];
export const getChatMessagesByChannelAndSession = (channel, session='current') => (state) => {
  const channelChatsSession = getChatsSession(state, channel, session);
  if (!channelChatsSession) {
    return noMessages;
  }

  return channelChatsSession.messages || noMessages;
};

export const getChatUnreadCountByChannelAndSession = (channel, session='current') => (state) => {
  const channelChatsSession = getChatsSession(state, channel, session);
  if (!channelChatsSession) {
    return 0;
  }

  return channelChatsSession.unreadCount || 0;
};

export const getCurrentChannelChatsSession = createSelector(
  [ getChannel, getChatsTable ],
  (channel, chatsTable) => {
    if (!channel) {
      return null;
    }

    const channelChats = chatsTable[channel];
    if (!channelChats) {
      return null;
    }

    const channelChatsSession = channelChats.current;
    if (!channelChatsSession) {
      return null;
    }

    return channelChatsSession;
  }
);
