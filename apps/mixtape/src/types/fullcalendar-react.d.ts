declare module '@fullcalendar/react' {
  import * as React from 'react';
  import type { CalendarApi, CalendarOptions } from '@fullcalendar/core';

  export default class FullCalendar extends React.Component<CalendarOptions> {
    getApi(): CalendarApi;
  }
}
