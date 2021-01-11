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

    // Filter potentially locally added data.
    const { id: _id, pending: _pending, error: _error, sender: _sender, target: _target, ts: _ts, ...sendMessageData } = message;
    // Create full message data.
    const initialMessageData = {
      ...sendMessageData,
      kind: '',
      sender: '', // Empty string means sender is self local.
      target: '', // Empty string means target is everyone in the channel.
      id: makeRandomChatID(),
      ts: new Date(),
    };
    // Add locally first.
    await (() => {
      const remove = [];
      if (_id) {
        // If with id, this send is a resend. So ensure to replace the old.
        remove.push(_id);
      }
      return dispatch(addChatMessages(channel, session, [{
        ...initialMessageData,
        pending: true,
      }], false, remove));
    })();
    // Then send to server.
    await dispatch(doSendChatMessage(channel, {
      ...sendMessageData,
      id: initialMessageData.id,
      kind: initialMessageData.kind,
      sender: initialMessageData.sender,
      target: initialMessageData.target,
    }, err => {
      // Error callback.
      return err;
    })).then(replyMessageData => {
      // Server reply or error.
      console.debug('meet sent, reply:', initialMessageData.id, replyMessageData);
      if (replyMessageData === null) {
        // Failed to send, update with error flag set.
        return {
          ...initialMessageData,
          pending: true,
          error: true,
        };
      } else {
        // Successful send, update with reply data.
        return {
          ...replyMessageData,
          ts: new Date(replyMessageData.ts * 1000),
          sender: '',
        };
      }
    }).then(updatedMessageData => {
      // Add result message data.
      return dispatch(addChatMessages(channel, session, [
        updatedMessageData,
      ], false, [initialMessageData.id]));
    });

    return initialMessageData.id;
  };
}

export const addChatMessages = (channel, session, messages, clear=false, remove=null) => ({
  type: CHATS_MESSAGES_ADD,
  channel,
  session,
  messages,
  clear,
  remove,
});

export const setChatVisibility = (channel, session, visible=true) => ({
  type: CHATS_VISIBILITY_SET,
  channel,
  session,
  hidden: !visible,
});
