import React from 'react';

import moment from '../moment';

const Timer = (props) => {
  const { start } = props;

  const [now, setNow] = React.useState(moment());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(moment());
    }, 1000);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  const duration = moment.duration(now.diff(start));
  const hours = parseInt(duration.as('hours'), 10);

  const result = [];
  if (hours > 0) {
    result.push(String(hours));
  }
  return [
    ...result,
    ('0' + duration.minutes()).slice(-2),
    ('0' + duration.seconds()).slice(-2),
  ].join(':');
};

export default Timer;
