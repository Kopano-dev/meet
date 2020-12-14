import moment from '../moment';

import sleep from 'kpop/es/utils/sleep';

import {
  CHATS_MESSAGES_ADD,
  CHATS_VISIBILITY_SET,
} from './types';

import {
  doSendChatMessage,
} from './kwm';

const example1 = [
  {
    sender: 'Bobbie Harper',
    text: 'Good morning everyone! How are you all doing?',
  },
  {
    text: 'Hi Mr. Harper! I’m fine thanks.',
  },
  {
    sender: 'Jen Jansen',
    text: ':claps:',
  },
  {
    sender: 'Jen Jansen',
    text: 'Hey! Always pumped up for a math class.',
  },
  {
    text: 'I wasn’t able to finish my homework mr. Harper, I have been ill for the last few days. I’m sorry!',
  },
  {
    sender: 'Jen Jansen',
    text: 'Oh no Belle!',
  },
  {
    sender: 'Bobbie Harper',
    text: 'Hope you’re ok!',
  },
];

const delay1 = {
  sender: 'Jen Jansen',
  text: 'Sorry, i was afk for a while ...',
};

export const makeRandomChatID = () => Math.random().toString(36).substring(7);

export function sendChatMessage(channel, session, message) {
  return async dispatch => {
    switch (message.text) {
      case '/clear':
        return dispatch(addChatMessages(channel, session, [], true));

      case '/example1': {
        await dispatch(addChatMessages(channel, session, [], true));
        const start = moment().add(-5, 'minute');
        example1.forEach(async (messageData, index) => {
          await dispatch(addChatMessages(channel, session, [{
            sender: '',
            ...messageData,
            ts: start.add(10 * index, 'second'),
            id: makeRandomChatID(),
          }]));
        });
        return;
      }

      case '/delay1':
        await sleep(5000);
        await dispatch(addChatMessages(channel, session, [{
          ...delay1,
          ts: new Date(),
          id: makeRandomChatID(),
        }]));
        return;

      default:
    }

    const messageData = {
      ...message,
      sender: '', // Empty string means sender is self local.
      target: '', // Empty string means target is everyone in the channel.
      id: makeRandomChatID(),
    };

    /*await dispatch(addChatMessages(channel, session, [{
      ...messageData,
      pending: true,
      ts: moment(),
    }]));*/

    dispatch(doSendChatMessage(channel, {
      ...message,
      sender: '',
      id: messageData.id,
    })).then(replyMessage => {
      console.debug('meet sent message reply', messageData.id, replyMessage);
      if (replyMessage === null) {
        // Failed to send.
        // TODO(longsleep): Dispatch error event, remove/update pending message.
      } else {
        dispatch(addChatMessages(channel, session, [{
          ...replyMessage,
          ts: new Date(replyMessage.ts * 1000),
          sender: '',
          localID: messageData.id,
        }]));
      }
    });

    return messageData.id;
  };
}

export const addChatMessages = (channel, session, messages, clear=false) => ({
  type: CHATS_MESSAGES_ADD,
  channel,
  session,
  messages,
  clear,
});

export const setChatVisibility = (channel, session, visible=true) => ({
  type: CHATS_VISIBILITY_SET,
  channel,
  session,
  hidden: !visible,
});
