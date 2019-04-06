import { Injectable } from '@angular/core';

import * as localForage from "localforage";

@Injectable({
  providedIn: 'root'
})

export class OfflineDbService {
  toDoWeek = localForage.createInstance({ name: 'toDoWeek' });

  constructor() {
    localForage.config({
      driver: localForage.LOCALSTORAGE, // Force WebSQL; same as using setDriver()
      name: 'fastAgenda',
      version: 1.0,
      size: 104857600, // Size of database - 100MB
      storeName: 'fast_agenda_DB', // Should be alphanumeric, with underscores.
      description: 'Fast agenda DB for offline usage.'
    });
  }

  saveToDoWeekData(value) {
    this.toDoWeek.setItem('toDoWeek', value, (error) => console.log(error));
  }

  getDoToWeekData() {
    return this.toDoWeek.getItem('toDoWeek', (error) => console.log(error))
  }


}

