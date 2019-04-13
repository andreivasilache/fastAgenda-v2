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

  clearCollection(variableName) {
    this[variableName].clear()
  }

  pushDataToOfflineDb(data) {
    console.log(data);
    this.toBeSavedWhenOnline.getItem('toBeSaved').then((item) => {
      if (item != null && item.constructor === Array) {
        console.log(typeof (item));
        let localItem: any = item;
        localItem.push(data);
        this.saveLocal('toBeSaved', 'toBeSavedWhenOnline', localItem);
      }
      else if (item != null && typeof (item) === 'object') {
        let localItem = [];
        localItem.push(item);
        localItem.push(data);
        this.saveLocal('toBeSaved', 'toBeSavedWhenOnline', localItem);
      }
      else
        this.saveLocal('toBeSaved', 'toBeSavedWhenOnline', data);
    })
  }

  saveLocal(localNameString, variableName, data) {
    this[variableName].setItem(localNameString, data).then((e) => { console.log("Data saved!") });
  }

  deleteOffline(id) {
    this.searchInLocalData('toDoWeek', 'toDoWeek', id);
    this.searchInLocalData('toBeSavedWhenOnline', 'toBeSaved', id);
  }

  searchInLocalData(variableName, localForgeValue, idToBeDeleted) {
    this[variableName].getItem(localForgeValue, (err, value) => {
      if (value) {
        if (value.constructor.name === "Object") {
          if (value.id === idToBeDeleted) this.clearCollection(variableName);
        } else {
          let foundIndex = this.searchInArray(value, 'id', idToBeDeleted);
          this.deleteFromLocalData(variableName, localForgeValue, foundIndex);
        }
      }
    });
  }

  deleteFromLocalData(variableName, localForgeValue, localArrayIndex) {
    this[variableName].getItem(localForgeValue, (err, value) => {
      console.log(value);
      if (value) {
        value.splice(localArrayIndex, 1);
        this.saveLocal(localForgeValue, variableName, value);
        // console.log(value[localArrayIndex]);
      }
    });
  };


  searchInArray(array, propriety, proprietyValue) {
    // let searchArray = array.filter(obj => obj[propriety] === proprietyValue)
    let index;
    for (let i = 0; i < array.length; i++) {
      if (array[i][propriety] === proprietyValue) {
        index = i;
      }
    }
    return index;
    // return searchArray.length != 0;
  }



}

