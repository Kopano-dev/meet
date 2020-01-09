import React from 'react';
import PropTypes from 'prop-types';

export const ManagedDialogContext = React.createContext({});

export const withManagedDialog = id => Component => {
  const WithManagedDialog = (props, ref) => {
    const { onClose, ...other } = props; // eslint-disable-line react/prop-types
    return (
      <ManagedDialogContext.Consumer>
        {md =>
          <Component
            {...other}
            open={!!md.state[id]}
            ref={ref}
            onClose={() => {
              md.close(id);
              if (onClose) {
                onClose();
              }
            }}
          />}
      </ManagedDialogContext.Consumer>
    );
  };
  return React.forwardRef(WithManagedDialog);
};

class ManagedDialogProvider extends React.PureComponent {
  constructor(props, context = {}) {
    super(props, context);

    const state = {
      open: this.open,
      close: this.close,
      state: {},
    };

    this.state = state;
  }

  open = id => {
    const { state } = this.state;

    if (!state[id]) {
      this.setState({
        state: {
          ...state,
          [id]: true,
        },
      });
    }
  }

  close = id => {
    const { state} = this.state;

    if (id) {
      const { [id]: _, ...s } = state; // eslint-disable-line no-unused-vars
      this.setState({
        state: s,
      });
    } else {
      this.setState({
        state: {},
      });
    }
  }

  render() {
    const { children } = this.props;

    return (
      <ManagedDialogContext.Provider value={this.state}>
        {children}
      </ManagedDialogContext.Provider>
    );
  }
}

ManagedDialogProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ManagedDialogProvider;
