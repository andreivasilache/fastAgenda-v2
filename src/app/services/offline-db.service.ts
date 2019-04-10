import { Injectable } from '@angular/core';

import * as localForage from "localforage";

@Injectable({
  providedIn: 'root'
})

export class OfflineDbService {
  toDoWeek = localForage.createInstance({ name: 'toDoWeek' });
  toBeSavedWhenOnline = localForage.createInstance({ name: 'toBeSaved' });
  toBeDeletedWhenOffline = localForage.createInstance({ name: 'toBeDeleted' });



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
  checkInternetConnection() {
    return navigator.onLine;
  }

  getDoToWeekOfflineData() {
    this.toDoWeek.getItem('toDoWeek', (err, value) => {
      return value;
    });
  }

  saveToDoWeekData(value) {
    this.toDoWeek.setItem('toDoWeek', value).then(() => { });
  }

  pushDataToOfflineDb(data) {
    console.log(data);
    this.toBeSavedWhenOnline.getItem('toBeSaved').then((item) => {
      if (item && typeof (item) == 'object') {

        // let localItem = [];
        // Object.keys(item).map(function (key) { localItem.push(item[key]); });
        // localItem.push(item);
        // localItem.push(data);
        // debugger;
        // this.saveLocal('toBeSaved', 'toBeSavedWhenOnline', localItem);
      }

      // }
      // console.log(typeof (item));
      //   let localItem: any = item;
      //   localItem.push(data);
      //   this.saveLocal('toBeSaved', 'toBeSavedWhenOnline', localItem);

      this.saveLocal('toBeSaved', 'toBeSavedWhenOnline', data);
    })
  }

  saveLocal(localNameString, variableName, data) {
    this[variableName].setItem(localNameString, data).then((e) => { console.log("Data saved!") });
  }

  // getDoToWeekData() {
  //   // return this.toDoWeek.getItem('toDoWeek', (error) => console.log(error))
  // }


}

