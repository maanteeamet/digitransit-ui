import config from '../config';

import moment from 'moment';

// Configure moment with the selected language
// and with the relative time thresholds used when humanizing times
function configureMoment(language) {
  moment.locale(language);
  if (language !== 'en') {
    require(`moment/locale/${language}`);
  }

  moment.relativeTimeThreshold('s', config.moment.relativeTimeThreshold.seconds);
  moment.relativeTimeThreshold('m', config.moment.relativeTimeThreshold.minutes);
  moment.relativeTimeThreshold('h', config.moment.relativeTimeThreshold.hours);
  moment.relativeTimeThreshold('d', config.moment.relativeTimeThreshold.days);
  moment.relativeTimeThreshold('M', config.moment.relativeTimeThreshold.months);
  return moment;
}

module.exports = configureMoment;