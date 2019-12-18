import React from 'react';

import Dialog from '@material-ui/core/Dialog';
import { useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const ResponsiveDialog = React.forwardRef(function ResponsiveDialog(props, ref) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return <Dialog ref={ref} fullScreen={fullScreen} {...props}/>;
});

export default ResponsiveDialog;
