import {
  KWM_CHANNEL_CHANGED,
  CHATS_MESSAGES_ADD,
  CHATS_MESSAGES_RECEIVED,
  CHATS_MESSAGES_DELIVERY_QUEUED,
  CHATS_VISIBILITY_SET,
} from '../actions/types';

import { makeRandomChatID } from '../actions/chats';

const defaultState = {
  /*
  $channel: {
    $session: {
      messages: [],
      unreadCount: 0,
      hidden: false,
    }
  }
  */
};

function getOrCreateChatsSession(state, channel, session) {
  const channelChats = {
    ...state[channel],
  };
  const channelChatsSession = {
    messages: [],
    unreadCount: 0,
    hidden: true,
    ...channelChats[session],
  };
  return [ channelChats, channelChatsSession ];
}

function chatsReducer(state = defaultState, action) {
  switch (action.type) {
    case KWM_CHANNEL_CHANGED: {
      const { channel } = action;
      const session = 'current';

      if (channel) {
        const [ channelChats, channelChatsSession ] = getOrCreateChatsSession(state, channel, session);
        channelChatsSession.messages = [...channelChatsSession.messages, {
          kind: 'system',
          id: makeRandomChatID(),
          ts: new Date(),
          richText: 'You have joined the meeting.',
          extra: {
            id: 'joined_self',
            values: {},
          },
        }];
        channelChats[session] = channelChatsSession;
        return {
          ...state,
          [channel]: channelChats,
        };
      }
      break;
    }

    case CHATS_MESSAGES_RECEIVED:
    case CHATS_MESSAGES_ADD: {
      const { channel, session, messages, clear, remove } = action;
      const [ channelChats, channelChatsSession ] = getOrCreateChatsSession(state, channel, session);
      if (clear) {
        channelChatsSession.messages = [...messages];
        if (channelChatsSession.hidden) {
          channelChatsSession.unreadCount = messages.length;
        } else {
          channelChatsSession.unreadCount = 0;
        }
      } else {
        if (remove) {
          channelChatsSession.messages = channelChatsSession.messages.filter(m => {
            return !remove.includes(m.id);
          });
        } else {
          channelChatsSession.messages = [...channelChatsSession.messages];
        }
        channelChatsSession.messages.push(...messages);
        if (channelChatsSession.hidden) {
          channelChatsSession.unreadCount += messages.length;
        }
      }
      channelChats[session] = channelChatsSession;
      return {
        ...state,
        [channel]: channelChats,
      };
    }

    case CHATS_MESSAGES_DELIVERY_QUEUED: {
      const { channel, session, ids } = action;
      const [ channelChats, channelChatsSession ] = getOrCreateChatsSession(state, channel, session);
      if (!channelChatsSession.messages) {
        break;
      }
      channelChatsSession.messages = channelChatsSession.messages.map(m => {
        if (ids.includes(m.id)) {
          return {
            ...m,
            delivered: true,
          };
        }
        return m;
      });
      channelChats[session] = channelChatsSession;
      return {
        ...state,
        [channel]: channelChats,
      };
    }

    case CHATS_VISIBILITY_SET: {
      const { channel, session, hidden } = action;
      const [ channelChats, channelChatsSession ] = getOrCreateChatsSession(state, channel, session);

      if (channelChatsSession.hidden !== hidden) {
        channelChatsSession.hidden = hidden;
        if (!hidden) {
          channelChatsSession.unreadCount = 0;
        }
        channelChats[session] = channelChatsSession;
        return {
          ...state,
          [channel]: channelChats,
        };
      }
      break;
    }

    default:
  }

  return state;
}

export default chatsReducer;
