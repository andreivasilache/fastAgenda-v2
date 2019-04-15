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
    this[variableName].setItem(localNameString, data).then((e) => { console.log("Data saved!"); });
  }

  deleteOffline(id) {
    /*
      Sort when to get data from localdata or when to get data from toBeSavedWhenOnline
    */
    this.toDoWeek.getItem('toDoWeek', (err, value) => {

    });
    this.searchInLocalData('toDoWeek', 'toDoWeek', id);
    this.searchInLocalDataToBeSaved('toBeSavedWhenOnline', 'toBeSaved', id);
  }

  searchInLocalData(variableName, localForgeValue, idToBeDeleted) {
    this.toDoWeek.getItem(localForgeValue, (err, value) => {
      if (value) {
        if (value.constructor.name === "Object") {
          let gottenData: any = value;
          if (gottenData.id === idToBeDeleted) {
            this.pushDataToBeDeletedLocal(value);
            this.clearCollection(variableName);
          };
        } else {
          let foundIndex = this.returnLocalIndex(value, 'id', idToBeDeleted);
          this.deleteFromLocalData(variableName, localForgeValue, foundIndex);
        }
      }
    });
  }

  searchInLocalDataToBeSaved(variableName, localForgeValue, idToBeDeleted) {
    this.toBeSavedWhenOnline.getItem(localForgeValue, (err, value) => {
      if (value) {
        if (value.constructor.name === "Object") {
          this.clearCollection('toBeSavedWhenOnline');
        } else {
          let foundIndex = this.returnLocalIndex(value, 'id', idToBeDeleted);
          this.deleteFromLocalData(variableName, localForgeValue, foundIndex);
        }
      }
    });
  }
  deleteFromLocalData(variableName, localForgeValue, localArrayIndex) {
    this[variableName].getItem(localForgeValue, (err, value) => {
      if (value) {
        let deleted = value.splice(localArrayIndex, 1);

        this.saveLocal(localForgeValue, variableName, value);
        if (variableName != 'toBeSavedWhenOnline') this.pushDataToBeDeletedLocal(deleted);
      }
    });
  };



  // searchInLocalData(variableName, localForgeValue, idToBeDeleted) {
  //   this[variableName].getItem(localForgeValue, (err, value) => {
  //     if (value) {
  //       if (value.constructor.name === "Object") {
  //         if (value.id === idToBeDeleted) {
  //           this.pushDataToBeDeletedLocal(value);
  //           this.clearCollection(variableName);
  //         };
  //       } else {
  //         let foundIndex = this.returnLocalIndex(value, 'id', idToBeDeleted);
  //         this.deleteFromLocalData(variableName, localForgeValue, foundIndex);
  //       }
  //     }
  //   });
  // }



  pushDataToBeDeletedLocal(deletedElement) {
    this.toBeDeletedWhenOffline.getItem('toBeDeletedWhenOffline', (err, toBeDeletedValue) => {
      if (toBeDeletedValue) {
        let localToBeDeleted: any = toBeDeletedValue;
        if (localToBeDeleted.constructor.name === "Object") {
          let localArray = [];
          localArray.push(localToBeDeleted);
          localArray.push(deletedElement);
          this.saveLocal('toBeDeletedWhenOffline', 'toBeDeletedWhenOffline', localArray);
        } else {
          localToBeDeleted.push(deletedElement[0]);
          this.saveLocal('toBeDeletedWhenOffline', 'toBeDeletedWhenOffline', localToBeDeleted);
        }
      } else {
        this.saveLocal('toBeDeletedWhenOffline', 'toBeDeletedWhenOffline', deletedElement);
      }
    })
  }


  returnLocalIndex(array, propriety, proprietyValue) {
    let index;
    for (let i = 0; i < array.length; i++) {
      if (array[i][propriety] === proprietyValue) {
        index = i;
      }
    }
    return index;
  }



}

