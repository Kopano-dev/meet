import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { withStyles } from 'material-ui/styles';
import List, { ListItem, ListItemText, ListItemSecondaryAction } from 'material-ui/List';
import Typography from 'material-ui/Typography';
import Tooltip from 'material-ui/Tooltip';

import Moment from 'react-moment';

import Persona from 'kpop/es/Persona';


const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // See https://bugzilla.mozilla.org/show_bug.cgi?id=1043520
    userSelect: 'none',
  },
  entries: {
    overflow: 'auto',
    flex: 1,
  },
  time: {
    paddingRight: theme.spacing.unit * 2,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  },
});

class Recents extends React.PureComponent {
  handleEntryClick = (event) => {
    const { onEntryClick } = this.props;

    if (event.target !== event.currentTarget) {
      // Climb the tree.
      let elem = event.target;
      let row = null;
      let id = null;
      for ( ; elem && elem !== event.currentTarget; elem = elem.parentNode) {
        row = elem;
        id = row.getAttribute('data-entry-id');
        if (id) {
          break;
        }
      }

      if (id) {
        onEntryClick(id);
      }
    }
  }

  render() {
    const {
      classes,
      className: classNameProp,
      recents,
    } = this.props;

    const className = classNames(
      classes.root,
      classNameProp,
    );

    const items = recents;

    const noRecents = items.length === 0 ? (
      <ListItem>
        <ListItemText>
          <Typography variant="caption" align="center">
            You have no recent meetings.
          </Typography>
        </ListItemText>
      </ListItem>
    ) : null;

    return (
      <div className={className}>
        <div className={classes.entries}>
          <List disablePadding onClick={this.handleEntryClick}>
            {items.map((entry) =>
              <ListItem button data-entry-id={entry.id} key={entry.id}>
                <Persona user={mapEntryToUserShape(entry)}/>
                <ListItemText primary={entry.displayName} secondary={entry.jobTitle} />
                <ListItemSecondaryAction>
                  <Tooltip
                    enterDelay={500}
                    placement="left"
                    title={<Moment>{entry.date}</Moment>}
                  >
                    <Typography variant="caption" className={classes.time}>
                      <Moment fromNow >{entry.date}</Moment>
                    </Typography>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            )}
            {noRecents}
          </List>
        </div>
      </div>
    );
  }
}

Recents.propTypes = {
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,

  recents: PropTypes.array.isRequired,

  onEntryClick: PropTypes.func,
};

const mapStateToProps = state => {
  const { sorted, table } = state.recents;

  const recents = sorted.map(id => table[id]);

  return {
    recents,
  };
};

const mapEntryToUserShape = entry => {
  return {
    guid: entry.mail ? entry.mail : entry.id,
    ...entry,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(Recents));
