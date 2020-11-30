import { defineMessages } from 'react-intl';

const translations = defineMessages({
  audioIsMutedSnack: {
    id: 'callView.audioIsMutedSnack.message',
    defaultMessage: 'Audio playback is muted.',
  },
  microphoneIsMutedSnack: {
    id: 'callView.microphoneIsMutedSnack.message',
    defaultMessage: 'Your microphone is muted.',
  },
  noConnectionTooltipTitle: {
    id: 'callView.noConnectionTooltip.title',
    defaultMessage: 'No connection - check your Internet connection.',
  },
  tabLabelCalls: {
    id: 'callView.tabCalls.label',
    defaultMessage: 'Calls',
  },
  tabLabelContacts: {
    id: 'callView.tabContacts.label',
    defaultMessage: 'Contacts',
  },
  fabButtonAriaLabel: {
    id: 'callView.fabButton.aria',
    defaultMessage: 'add',
  },
  masterButtonLabel: {
    id: 'callView.masterButton.label',
    defaultMessage: 'New call',
  },
  newCallDialogTopTitle: {
    id: 'callView.newCallDialog.topTitle',
    defaultMessage: 'New call',
  },
  newPublicGroupDialogTopTitle: {
    id: 'callView.newPublicGroupDialog.topTitle',
    defaultMessage: 'Join or create group',
  },
  inviteDialogTopTitle: {
    id: 'callView.inviteDialog.topTitle',
    defaultMessage: 'Invite to "{id}"',
  },
  copiedLinkToClipboardSnack: {
    id: 'callView.copiedLinkToClipboard.snack',
    defaultMessage: 'Link copied to clipboard.',
  },
  inviteByMailtoSnack: {
    id: 'callView.inviteByMailTo.snack',
    defaultMessage: 'Invitation email created, opening your mail program now.',
  },
  inviteShareLinkSubject: {
    id: 'callView.inviteByShareLink.subject.template',
    defaultMessage: 'Invitation to "{id}"',
  },
  inviteShareLinkText: {
    id: 'callView.inviteByShareLink.text.template',
    defaultMessage: 'You can join this meeting from your computer, tablet or smartphone.\n\n',
  },
});

export default translations;
