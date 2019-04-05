import { Component, OnInit } from '@angular/core';
import { CalendarService } from '../services/calendar.service';
import { AuthService } from '../services/auth.service';

export interface googleCalendarRetrivedData {
  id: String,
  summary: String,
  description: String,
  startHour: String,
  startMinutes: String,
  endHour: String,
  endMinutes: String,
}


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})



export class HomeComponent implements OnInit {

  todayEvents = [];

  verifyIfIsInitialized;

  dropDownRemainedHoursStart = [];
  dropDownRemainedHoursEnd = [];
  dropDownMinutes = [];
  editEventToggler = [];

  usedTimeInterval = [];
  freeHours = [];

  dropDownAddEventRemainedMinutesStart = [];
  dropDownAddEventRemainedMinutesStop = [];
  toggleAddEventForm = false;

  hour = new Date().getHours();
  minutes = new Date().getMinutes();
  dd = new Date().getDate();
  mm = new Date().getMonth() + 1; //January is 0!
  yyyy = new Date().getFullYear();
  todayDate = this.dd + ' ' + this.mm + ' ' + this.yyyy;

  updateDateVars() {
    this.hour = new Date().getHours();
    this.minutes = new Date().getMinutes();
  }

  generateDropdownHoursStart(todayEventsItteratorValue?) {
    this.dropDownRemainedHoursStart.length = 0;
    for (let hourItterator = this.hour; hourItterator <= 23; hourItterator++) {
      this.dropDownRemainedHoursStart.push(hourItterator);
    }
    if (typeof (todayEventsItteratorValue) === 'number') {
      this.generateDropDownMinutesFromForm(todayEventsItteratorValue);
    }

  }

  generateDropdownHoursEnd() {
    this.dropDownRemainedHoursEnd.length = 0;
    for (let hourItterator = this.hour + 1; hourItterator <= 23; hourItterator++) {
      this.dropDownRemainedHoursEnd.push(hourItterator);
    }
  }

  pushMinutesToArray(minute, array) {
    if (minute <= 9) {
      let inFrontZero = '0' + String(minute);
      array.push(inFrontZero);
    } else {
      array.push(minute);
    }
  }

  generateDropDownMinutesConstructor() {
    for (let minutesItterator = 0; minutesItterator <= 59; minutesItterator++) {
      this.pushMinutesToArray(minutesItterator, this.dropDownMinutes)
    }
  }

  generateDropDownMinutesFromForm(todayEventsItteratorValue) {
    this.dropDownMinutes.length = 0;
    let startMinutesValue = this.todayEvents[todayEventsItteratorValue].startHour == this.hour ? this.minutes : 0;
    for (let minutesItterator = startMinutesValue; minutesItterator <= 59; minutesItterator++) {
      this.pushMinutesToArray(minutesItterator, this.dropDownMinutes)
    }
  }

  saveChanges(formData, id, index) {
    if ((formData.startMinutes >= formData.endMinutes && formData.startHour == formData.endHour) || formData.startHour <= formData.endHour) {
      this.calendarData.editCalendarData(id, formData.startHour, formData.endHour, formData.startMinutes, formData.endMinutes, formData.title, formData.description)
      this.todayEvents[index] = {
        id: id,
        summary: formData.title,
        description: formData.description,
        startHour: Number(formData.startHour),
        startMinutes: Number(formData.startMinutes),
        endHour: Number(formData.endHour),
        endMinutes: Number(formData.endMinutes),
      }
      this.editEventToggler[index] = false;
      this.iterateTroughtTime();
    }
  }

  initializateEditFormToggler(arrayLenght) {
    for (let i = 0; i < arrayLenght; i++) {
      this.editEventToggler[i] = false;
    }
  }

  constructor(private calendarData: CalendarService, private auth: AuthService) {
    setInterval(() => {
      this.updateDateVars();
    }, 500);
  }

  ngOnInit() {

    this.generateDropdownHoursStart();
    this.generateDropdownHoursEnd();
    this.generateDropDownMinutesConstructor();
    this.fillMinutesAndHoursNewEvent();
    if (this.auth.homePageInited == false) {
      this.verifyIfIsInitialized = this.auth.clientIsInit.subscribe((isInited) => {
        if (isInited) {
          setTimeout(() => {
            this.getTodayEvents();
            this.auth.homePageInited = true;
          }, 500)
        }
      })
    } else {
      this.todayEvents = [];
      this.getTodayEvents();
    }

  }
  addNewEventClickEvent() {
    this.toggleAddEventForm = !this.toggleAddEventForm;

  }

  getTodayEvents() {
    this.calendarData.getTodayEvents();
    this.calendarData.todayEvents.subscribe(
      (events: any) => {
        this.parseTodayEventsGotData(events.result.items);
        this.iterateTroughtTime();
        console.log(events.result.items);
      }
    )
  }

  iterateTroughtTime() {
    this.usedTimeInterval.length = 0;
    for (let i = 0; i < this.todayEvents.length; i++) {
      this.generateUsedTimeInterval(Number(this.todayEvents[i].startHour), Number(this.todayEvents[i].startMinutes), Number(this.todayEvents[i].endHour), Number(this.todayEvents[i].endMinutes));
    }

    if (this.usedTimeInterval.length != 0) {
      this.generateFreeHours();
    }
  }
  generateUsedTimeInterval(startHour, startMinutes, endHour, endMinutes) {
    let startHourLocal: number;
    let endHourLocal: number;
    if (startMinutes == 0) {
      startHourLocal = startHour - 1;
      startMinutes = 59
    } else {
      startHour = startHour
    }
    if (endMinutes == 59 && endHour != 23) {
      endHourLocal = endHour + 1;
      endMinutes = 0
    }

    this.usedTimeInterval.push({
      startHour: typeof (startHourLocal) == 'number' ? startHourLocal : startHour,
      startMinutes,
      endHour: typeof (endHourLocal) == 'number' ? endHourLocal : endHour,
      endMinutes
    });
  }

  fillMinutesAndHoursNewEvent() {
    if (this.todayEvents.length == 0) {
      for (let iterator = 0; iterator <= 59; iterator++) {
        this.pushMinutesToArray(iterator, this.dropDownAddEventRemainedMinutesStart);
        this.pushMinutesToArray(iterator, this.dropDownAddEventRemainedMinutesStop);
      }
    }
    for (let hour = this.hour; hour <= 23; hour++) {
      this.freeHours.push(hour);
    }
  }

  generateFreeHours() {
    let occupiedHours = [];
    let remainedHours = [];

    for (let timeItterator = 0; timeItterator < this.usedTimeInterval.length; timeItterator++) {
      if (this.usedTimeInterval[timeItterator].endHour - this.usedTimeInterval[timeItterator].startHour >= 2) {
        for (let occupied = this.usedTimeInterval[timeItterator].startHour + 1; occupied <= this.usedTimeInterval[timeItterator].endHour - 1; occupied++) {
          occupiedHours.push(occupied);
        }
      }
    }
    for (let hour = this.hour; hour <= 23; hour++) {
      remainedHours.push(hour);
    }
    this.freeHours = remainedHours.filter(x => !occupiedHours.includes(x));
  }

  generateMinutesForNewEvent(fromWhere, selectedHour?) {

    if (typeof (selectedHour) === 'string') {
      if (fromWhere == 'start') {
        this.dropDownAddEventRemainedMinutesStart.length = 0;
        let returnedVal = this.searchInObjectByValue(this.usedTimeInterval, 'endHour', Number(selectedHour));
        let itteratorStart = typeof (returnedVal) == 'undefined' ? 0 : returnedVal['endMinutes'];
        for (let iterator = itteratorStart; iterator <= 59; iterator++) {
          this.pushMinutesToArray(iterator, this.dropDownAddEventRemainedMinutesStart);
        }
      }
      else {
        this.dropDownAddEventRemainedMinutesStop.length = 0;
        let returnedVal = this.searchInObjectByValue(this.usedTimeInterval, 'startHour', Number(selectedHour));
        let IteratorLimit = 60;
        for (let iterator = 0; iterator < IteratorLimit; iterator++) {
          this.pushMinutesToArray(iterator, this.dropDownAddEventRemainedMinutesStop);
        }
      }
    }
  }

  searchInObjectByValue(obj, proprietyName, valueToBeFound) {
    let value = obj.filter((objIterator) => {
      return objIterator[proprietyName] == valueToBeFound
    });
    return value[0];
  }

  parseTodayEventsGotData(events) {

    for (let element = 0; element < events.length; element++) {
      this.todayEvents.push({
        id: events[element].id,
        summary: events[element].summary,
        description: events[element].description,
        startHour: new Date(events[element].start.dateTime).getHours(),
        startMinutes: new Date(events[element].start.dateTime).getMinutes(),
        endHour: new Date(events[element].end.dateTime).getHours(),
        endMinutes: new Date(events[element].end.dateTime).getMinutes(),
      })
      this.initializateEditFormToggler(this.todayEvents.length);
    }
  }

  saveNewEvent(eventData) {
    console.log(eventData);
    if ((eventData.newEventStartMinutes >= eventData.newEventEndMinutes && eventData.newEventStartHour == eventData.newEventEndHour) || eventData.newEventStartHour <= eventData.newEventEndHour) {
      this.calendarData.sendCalendarData(eventData.newEventStartHour, eventData.newEventEndHour, eventData.newEventStartMinutes, eventData.newEventEndMinutes, eventData.title, eventData.description);
      let subscriber = this.calendarData.newEventResponse.subscribe((eventSaved: googleCalendarRetrivedData) => {
        this.pushNewEventToArray(eventSaved);
        subscriber.unsubscribe();
        this.toggleAddEventForm = !this.toggleAddEventForm;
      });
    }
  }

  pushNewEventToArray(eventSaved) {
    this.todayEvents.push({
      id: eventSaved.id,
      summary: eventSaved.summary,
      description: eventSaved.description,
      startHour: new Date(eventSaved.start.dateTime).getHours(),
      startMinutes: new Date(eventSaved.start.dateTime).getMinutes(),
      endHour: new Date(eventSaved.end.dateTime).getHours(),
      endMinutes: new Date(eventSaved.end.dateTime).getMinutes(),
    })
    this.editEventToggler[this.todayEvents.length] = false;
    this.iterateTroughtTime();
    console.log(this.todayEvents);
  }


  deleteEvent(eventId, eventArrayIndex) {
    this.calendarData.deleteCalendarData(eventId);
    this.todayEvents.splice(eventArrayIndex, 1);
  }
}
