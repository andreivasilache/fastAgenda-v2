import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, Subject } from 'rxjs';

import * as moment from "moment";


@Injectable({
  providedIn: 'root'
})


export class CalendarService {
  calendarItems: any[];
  constructor(public auth: AuthService) { }

  todayEvents = new Subject<object>();
  newEventResponse = new Subject<object>();
  async getCalendar() {
    const events = await this.auth.getGapiInstance().client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: 'startTime'
    })
  }

  async getTodayEvents() {

    let now = moment().toDate();
    let midnight = moment().endOf("day").toDate();

    const events = await this.auth.getGapiInstance().client.calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: midnight.toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 30,
      orderBy: 'startTime'
    })
    this.todayEvents.next(events);
  }

  async editCalendarData(calendarId, eventStartTimeHours, eventEndTimeHours, eventStartTimeMinutes, eventEndTimeMinutes, eventTitle, eventDescription) {
    let todayStartEvent = moment();
    todayStartEvent.hour(eventStartTimeHours);
    todayStartEvent.minutes(eventStartTimeMinutes);

    let todayEndEvent = moment();
    todayEndEvent.hour(eventEndTimeHours);
    todayEndEvent.minutes(eventEndTimeMinutes);

    const request = await this.auth.getGapiInstance().client.calendar.events.update({
      calendarId: 'primary',
      eventId: calendarId,
      start: {
        dateTime: todayStartEvent.toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: todayEndEvent.toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      summary: eventTitle,
      description: eventDescription
    })
  }

  async sendCalendarData(eventStartTimeHours, eventEndTimeHours, eventStartTimeMinutes, eventEndTimeMinutes, eventTitle, eventDescription) {
    console.log(eventStartTimeHours, eventEndTimeHours, eventStartTimeMinutes, eventEndTimeMinutes, eventTitle, eventDescription);
    let todayStartEvent = moment();
    todayStartEvent.hour(eventStartTimeHours);
    todayStartEvent.minutes(eventStartTimeMinutes);

    let todayEndEvent = moment();
    todayEndEvent.hour(eventEndTimeHours);
    todayEndEvent.minutes(eventEndTimeMinutes);

    const insert = await this.auth.getGapiInstance().client.calendar.events.insert({
      calendarId: 'primary',
      start: {
        dateTime: todayStartEvent.toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: todayEndEvent.toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      summary: eventTitle,
      description: eventDescription
    }).execute((response) => {
      this.newEventResponse.next(response);
    })
  }

  async deleteCalendarData(eventId) {
    const events = await this.auth.getGapiInstance().client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    })
  }
}
