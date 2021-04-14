import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Relay from 'react-relay/classic';
import moment from 'moment';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { intlShape, FormattedMessage } from 'react-intl';
import sortBy from 'lodash/sortBy';

import { locationShape, routerShape } from 'react-router';
import RouteScheduleHeader from './RouteScheduleHeader';
import RouteScheduleTripRow from './RouteScheduleTripRow';
import DateSelect from './DateSelect';
import SecondaryButton from './SecondaryButton';
import Loading from './Loading';
import Icon from './Icon';
import { RealtimeStateType } from '../constants';
import TimetableWeekViewContainer from './TimetableWeekViewContainer';

const DATE_FORMAT = 'YYYYMMDD';

const routesWithWeekView = ['de2c42', '016e12', '1ccc48', 'bd4819'];

const isTripCanceled = trip =>
  trip.stoptimes &&
  Array.from(trip.stoptimes.entries())
    .map(x => x[1])
    .every(st => st.realtimeState === RealtimeStateType.Canceled);

class RouteScheduleContainer extends Component {
  static propTypes = {
    pattern: PropTypes.object.isRequired,
    relay: PropTypes.object.isRequired,
    serviceDay: PropTypes.string.isRequired,
  };

  static contextTypes = {
    intl: intlShape.isRequired,
    config: PropTypes.object.isRequired,
    location: locationShape.isRequired,
    router: routerShape.isRequired,
  };

  static transformTrips(trips, stops) {
    if (trips == null) {
      return null;
    }
    let transformedTrips = trips.map(trip => {
      const newTrip = { ...trip };
      newTrip.stoptimes = new Map();
      trip.stoptimes.forEach((stopTime, index) => {
        newTrip.stoptimes.set(`${stopTime.stop.id}-${index}`, stopTime);
      });
      return newTrip;
    });
    transformedTrips = sortBy(
      transformedTrips,
      trip => trip.stoptimes.get(`${stops[0].id}-0`).scheduledDeparture,
    );
    return transformedTrips;
  }

  constructor(props) {
    super(props);
    debugger;
    this.initState(props, true);
    props.relay.setVariables({ serviceDay: props.serviceDay });
  }

  componentWillReceiveProps(nextProps) {
    // If route has changed, reset state.
    if (
      nextProps.relay.route.params.patternId !==
      this.props.relay.route.params.patternId
    ) {
      this.initState(nextProps, false);
      nextProps.relay.setVariables({ serviceDay: nextProps.serviceDay });
    }
  }

  onFromSelectChange = event => {
    const from = Number(event.target.value);
    this.setState(prevState => {
      const to = prevState.to > from ? prevState.to : from + 1;
      return { ...prevState.state, from, to };
    });
  };

  onToSelectChange = event => {
    const to = Number(event.target.value);
    this.setState(prevState => ({ ...prevState.state, to }));
  };

  getTrips = (from, to) => {
    const { stops } = this.props.pattern;
    const trips = RouteScheduleContainer.transformTrips(
      this.props.pattern.tripsForDate,
      stops,
    );
    if (trips == null) {
      return <Loading />;
    }
    if (trips.length === 0) {
      return (
        <div className="text-center">
          {this.context.intl.formatMessage({
            id: 'no-trips-found',
            defaultMessage: 'No journeys found for the selected date.',
          })}
        </div>
      );
    }
    return trips.map(trip => {
      const fromSt = trip.stoptimes.get(`${stops[from].id}-${from}`);
      const toSt = trip.stoptimes.get(`${stops[to].id}-${to}`);
      const departureTime = this.formatTime(
        fromSt.serviceDay + fromSt.scheduledDeparture,
      );
      const arrivalTime = this.formatTime(
        toSt.serviceDay + toSt.scheduledArrival,
      );

      return (
        <RouteScheduleTripRow
          key={trip.id}
          departureTime={departureTime}
          arrivalTime={arrivalTime}
          isCanceled={isTripCanceled(trip)}
          wheelchairAccessible={trip.wheelchairAccessible}
        />
      );
    });
  };

  formatTime = timestamp => moment(timestamp * 1000).format('HH:mm');

  changeDate = ({ target }) => {
    // TODO: add setState and a callback that resets the laoding state in oreder to get a spinner.
    this.props.relay.setVariables({
      serviceDay: target.value,
    });
  };

  dateForPrinting = () => {
    const selectedDate = moment(this.props.relay.variables.serviceDay);
    return (
      <div className="printable-date-container">
        <div className="printable-date-icon">
          <Icon className="large-icon" img="icon-icon_schedule" />
        </div>
        <div className="printable-date-right">
          <div className="printable-date-header">
            <FormattedMessage id="date" defaultMessage="Date" />
          </div>
          <div className="printable-date-content">
            {moment(selectedDate).format('dd DD.MM.YYYY')}
          </div>
        </div>
      </div>
    );
  };

  openRoutePDF = (e, routePDFUrl) => {
    e.stopPropagation();
    window.open(routePDFUrl);
  };

  printRouteTimetable = e => {
    e.stopPropagation();
    window.print();
  };

  initState(props, isInitialState) {
    const state = {
      from: 0,
      to: props.pattern.stops.length - 1,
    };

    if (isInitialState) {
      this.state = state;
    } else {
      this.setState(state);
    }
  }

  render() {
    const routeIdSplitted = this.props.pattern.route.gtfsId.split(':');

    const tripId = this.props.pattern.tripsForDate[0].gtfsId;

    const routeTimetableHandler =
      this.context.config.routeTimetables &&
      this.context.config.routeTimetables[routeIdSplitted[0]];

    const routeTimetableUrl =
      routeTimetableHandler &&
      this.context.config.URL.ROUTE_TIMETABLES[routeIdSplitted[0]] &&
      routeTimetableHandler.timetableUrlResolver(
        this.context.config.URL.ROUTE_TIMETABLES[routeIdSplitted[0]],
        this.props.pattern.route,
      );

    const openWeekView = () => {
      this.context.router.push({
        ...this.context.location,
        state: {
          ...this.context.location.state,
          weekViewOpen: true,
        },
      });
    };

    const showWeekView = () => {
      return routesWithWeekView.indexOf(this.props.pattern.route.color) === -1;
    };

    return (
      <div className="route-schedule-content-wrapper">
        <div className="route-page-action-bar">
          <DateSelect
            startDate={this.props.serviceDay}
            selectedDate={this.props.relay.variables.serviceDay}
            dateFormat={DATE_FORMAT}
            onDateChange={this.changeDate}
          />
          {showWeekView() && (
            <button
              style={{ height: 'fit-content', margin: '3px auto auto 10px' }}
              className="cursor-pointer noborder"
              onClick={openWeekView}
            >
              <span
                style={{
                  textDecoration: 'underline',
                  color: 'blue',
                }}
              >
                nädala vaade
              </span>
            </button>
          )}
          {this.dateForPrinting()}
          <div className="print-button-container">
            {routeTimetableUrl && (
              <SecondaryButton
                ariaLabel="print-timetable"
                buttonName="print-timetable"
                buttonClickAction={e => this.openRoutePDF(e, routeTimetableUrl)}
                buttonIcon="icon-icon_print"
                smallSize
              />
            )}
            <SecondaryButton
              ariaLabel="print"
              buttonName="print"
              buttonClickAction={e => this.printRouteTimetable(e)}
              buttonIcon="icon-icon_print"
              smallSize
            />
          </div>
        </div>
        <div className="route-schedule-list-wrapper">
          <RouteScheduleHeader
            stops={this.props.pattern.stops}
            from={this.state.from}
            to={this.state.to}
            onFromSelectChange={this.onFromSelectChange}
            onToSelectChange={this.onToSelectChange}
          />
          <div className="route-schedule-list momentum-scroll">
            {this.getTrips(this.state.from, this.state.to)}
          </div>
        </div>
        {showWeekView() && (
          <TimetableWeekViewContainer
            tripId={tripId}
            modalToggle={openWeekView}
          />
        )}
      </div>
    );
  }
}

const connectedComponent = connectToStores(
  Relay.createContainer(RouteScheduleContainer, {
    initialVariables: {
      serviceDay: moment().format(DATE_FORMAT),
    },
    fragments: {
      pattern: () => Relay.QL`
        fragment on Pattern {
          stops {
            id
            name
          }
          route {
            url
            gtfsId
            shortName
            color
          }
          tripsForDate(serviceDay: $serviceDay) {
            id
            gtfsId
            wheelchairAccessible
            stoptimes: stoptimesForDate(serviceDay: $serviceDay) {
              realtimeState
              scheduledArrival
              scheduledDeparture
              serviceDay
              stop {
                id
              }
            }
          }
        }
      `,
    },
  }),
  [],
  context => ({
    serviceDay: context
      .getStore('TimeStore')
      .getCurrentTime()
      .format(DATE_FORMAT),
  }),
);

export { connectedComponent as default, RouteScheduleContainer as Component };
