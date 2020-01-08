import React from 'react';
import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { userRequiredError } from 'kpop/es/common/actions';

class UserRequired extends React.PureComponent {
  componentDidMount() {
    const { config, user } = this.props;

    if (config && !config.continue && !user) {
      // Directly trigger if config is already done.
      this.userRequiredError();
    }
  }

  componentDidUpdate(prevProps) {
    const { user } = this.props;

    if (!user && prevProps.user) {
      this.userRequiredError();
    }
  }

  userRequiredError = () => {
    const { userRequiredError } = this.props;

    userRequiredError();
  }

  render() {
    return null;
  }
}

UserRequired.propTypes = {
  userRequiredError: PropTypes.func.isRequired,

  user: PropTypes.object,
  config: PropTypes.object,
};

const mapStateToProps = (state) => {
  const { config, user } = state.common;

  return {
    config,
    user,
  };
};

const mapDispatchToProps = dispatch => bindActionCreators({
  userRequiredError,
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(UserRequired);
