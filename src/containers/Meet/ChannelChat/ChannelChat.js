import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import memoize from 'memoize-one';
import moment from '../../../moment';

import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';
import Divider from '@material-ui/core/Divider';
import Fab from '@material-ui/core/Fab';
import ArrowDownwardRoundedIcon from '@material-ui/icons/ArrowDownwardRounded';

import { FormattedMessage } from 'react-intl';

import { getChatMessagesByChannelAndSession } from '../../../selectors/chats';
import { sendChatMessage, setChatVisibility } from '../../../actions/chats';
import { sanitize } from '../../../sanitize';
import { isMobile } from '../../../utils';

import Message from './Message';
import System from './System';

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    flex: 1,
    position: 'relative',
    userSelect: 'text',
  },
  container: {
    display: 'flex',
    flexDirection: 'column-reverse',
    flex: 1,
    overflowY: 'scroll',
    '&:before': {
      position: 'absolute',
      content: '""',
      height: 6,
      top: -6,
      left: 0,
      right: 0,
      boxShadow: theme.shadows[6].split(',0px')[0],
      opacity: 0,
      ransition: 'opacity 0.5s',
      zIndex: 1,
    },
  },
  containerScrolledDown: {
    '&:before': {
      opacity: 1,
    },
  },
  controls: {
    position: 'relative',
    display: 'flex',
    paddingLeft: theme.spacing(2),
    '&:before': {
      position: 'absolute',
      content: '""',
      height: 6,
      top: 0,
      left: 0,
      right: 0,
      boxShadow: theme.shadows[6].split(',0px')[0],
      transform: 'rotateZ(180deg)',
      opacity: 0,
      transition: 'opacity 0.5s',
      zIndex: 1,
    },
  },
  controlsScrolledUp: {
    '&:before': {
      opacity: 1,
    },
  },
  controlsInput: {
    fontSize: '0.75rem',
    lineHeight: 1.35,
  },
  messages: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: theme.spacing(),
    paddingRight: theme.spacing(),
    paddingBottom: theme.spacing(),
  },
  message: {
  },
  messagesBottom: {
    border: '1px solid transparent',
    marginBottom: theme.spacing(-1),
  },
  system: {
    ...theme.typography.body2,
    fontSize: '0.75rem',
    lineHeight: 1.35,
    color: theme.palette.grey[500],
    marginLeft: 9,
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing() + 4,
  },
  fob: {
    position: 'absolute',
    top: -48 - theme.spacing(),
    left: 0,
    right: 0,
    zIndex: 1,
    textAlign: 'center',
    '& > button': {
      fontSize: '0.8rem',
      fontWeight: 400,
    },
    '& > button > span > span': {
      padding: theme.spacing(0, 1, 0, 1),
    },
  },
});

class ChannelChat extends React.PureComponent {
  scrollPosition = 0;
  scrollTicking = false;

  constructor(props) {
    super(props);

    this.state = {
      scrollLastSeenMessageID: null,
      scrollOverflow: false,
      inputText: '',
    };

    this.containerRef = React.createRef();
    this.messagesBottomRef = React.createRef();
  }

  makeMessage(message, index, array) {
    const {
      classes,
    } = this.props;

    let noHeader = false;
    if (index > 0) {
      const previousMessage = array[index-1];
      if (previousMessage.sender === message.sender
        && previousMessage.kind === message.kind
        && moment(message.ts).diff(previousMessage.ts) < 95 * 1000
      ) {
        noHeader = true;
      }
    }

    switch (message.kind) {
      case '':
        // TODO(longsleep): Add more conditions which force header, like time too
        // long since last message etc ..
        return <Message
          className={classes.message}
          key={message.id}
          message={message}
          noHeader={noHeader}
          onRetry={this.handleRetry}
        />;

      case 'system':
        return <System
          className={classes.system}
          key={message.id}
          message={message}
        />;

      default:
    }
  }

  getLastMessageID = memoize(messages => {
    return messages ? messages[messages.length - 1].id : null;
  })

  makeMessages = memoize(messages => {
    return messages.map((message, index, array) => this.makeMessage(message, index, array));
  })

  componentDidMount() {
    const { setChatVisibility, channel, session } = this.props;

    this.computeScrollOverflow();
    this.scrollToBottom('auto');

    this.containerRef.current.addEventListener('scroll', this.handleScroll, {passive: true});
    setChatVisibility(channel, session, true);
  }

  componentDidUpdate() {
    const { scrollLastSeenMessageID } = this.state;

    this.computeScrollOverflow();
    if (scrollLastSeenMessageID === null) {
      this.scrollToBottom('auto');
    }
  }

  componentWillUnmount() {
    const { setChatVisibility, channel, session } = this.props;

    this.containerRef.current.removeEventListener('scroll', this.handleScroll);
    setChatVisibility(channel, session, false);
  }

  scrollToBottom = (behavior='smooth') => {
    this.messagesBottomRef.current.scrollIntoView({behavior, block: 'end', inline: 'nearest'});
  }

  computeScrollOverflow = () => {
    const { scrollOverflow } = this.state;

    const currentScrollOverflow = this.containerRef.current.scrollHeight !== this.containerRef.current.clientHeight;
    if (scrollOverflow !== currentScrollOverflow) {
      this.setState({
        scrollOverflow: currentScrollOverflow,
      });
    }
  }

  handleScroll = () => {
    this.scrollPosition = this.containerRef.current.scrollTop;

    if (!this.scrollTicking) {
      window.requestAnimationFrame(() => {
        const { scrollLastSeenMessageID } = this.state;
        const { messages } = this.props;

        this.scrollTicking = false;
        if (this.scrollPosition < -20 && scrollLastSeenMessageID === null) {
          this.setState({
            scrollLastSeenMessageID: this.getLastMessageID(messages),
          });
        } else if (this.scrollPosition >= -20 && scrollLastSeenMessageID !== null) {
          this.setState({
            scrollLastSeenMessageID: null,
          });
        }
      });
      this.scrollTicking = true;
    }
  }

  handleInputTextChange = event => {
    this.setState({
      inputText: event.target.value,
    });
  }

  handleInputTextKeyPress = event => {
    const { sendWithCTRLEnter } = this.props;

    if (event.key === 'Enter') {
      if (event.shiftKey) { /* empty */
      } else if (!sendWithCTRLEnter || event.ctrlKey) {
        event.preventDefault();
        this.handleSend();
      }
    }
  }

  handleSend = async () => {
    const { inputText } = this.state;

    if (!inputText) {
      return;
    }

    const updates = {
      inputText: '',
    };

    const text = new Option(inputText).innerHTML;
    const message = {
      text,
      richText: sanitize(text, 'text', true, false, true),
    };

    await this.doSendChatMessage(message);

    this.setState(updates);
  }

  handleRetry = async (message) => {
    await this.doSendChatMessage(message);
  }

  doSendChatMessage = async (message) => {
    const { channel, session, sendChatMessage } = this.props;

    await sendChatMessage(channel, session, message);
    this.scrollToBottom('auto');
  }

  render() {
    const {
      classes,
      className: classNameProp,

      messages,
    } = this.props;

    const { inputText, scrollOverflow, scrollLastSeenMessageID } = this.state;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const scrolledNewMessages = scrollLastSeenMessageID !== null && this.getLastMessageID(messages) !== scrollLastSeenMessageID;

    return (
      <div className={className}>
        <div className={classNames(classes.container, {
          [classes.containerScrolledDown]: scrollOverflow,
        })} ref={this.containerRef}>
          <div className={classes.messages}>
            {this.makeMessages(messages)}
            <div className={classes.messagesBottom} ref={this.messagesBottomRef}></div>
          </div>
        </div>
        <Divider/>
        <div className={classNames(classes.controls, {
          [classes.controlsScrolledUp]: scrollLastSeenMessageID !== null,
        })}>
          {scrolledNewMessages && <div className={classes.fob}>
            <Fab variant="extended" size="small" color="primary" onClick={() => this.scrollToBottom()}>
              <ArrowDownwardRoundedIcon fontSize="inherit"/><span><FormattedMessage
                id="chat.newMessagesFob.label"
                defaultMessage="New messages">
              </FormattedMessage></span>
            </Fab>
          </div>}
          <TextField
            InputProps={{
              className: classes.controlsInput,
            }}
            size="small"
            fullWidth={true}
            margin="dense"
            multiline
            placeholder="Type a message"
            rowsMax={5}
            value={inputText}
            onChange={this.handleInputTextChange}
            onKeyPress={this.handleInputTextKeyPress}
            autoFocus={!isMobile}
          />
          <IconButton color="primary" onClick={this.handleSend}>
            <SendIcon />
          </IconButton>
        </div>
      </div>
    );
  }
}

ChannelChat.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  channel: PropTypes.string.isRequired,
  session: PropTypes.string.isRequired,
  sendWithCTRLEnter: PropTypes.bool,

  messages: PropTypes.arrayOf(PropTypes.object).isRequired,

  sendChatMessage: PropTypes.func.isRequired,
  setChatVisibility: PropTypes.func.isRequired,
};

const mapStateToProps = (state, ownProps) => {
  const { channel, session } = ownProps;

  return {
    messages: getChatMessagesByChannelAndSession(channel, session)(state),
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  sendChatMessage,
  setChatVisibility,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ChannelChat));

