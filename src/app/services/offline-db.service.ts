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
  isObject(item) {
    return item.constructor.name === "Object";
  }

  isArray(item) {
    return item.constructor === Array;
  }

  clearCollection(variableName) {
    this[variableName].clear()
  }

  pushDataToOfflineDb(data) {
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

  async deleteOffline(id) {
    await this.checkIfIsInLocalStore('toDoWeek', 'toDoWeek', id).then((isHere) => {
      if (isHere) this.deleteFromLocalStore('toDoWeek', 'toDoWeek', id);
    })
    await this.checkIfIsInLocalStore('toBeSavedWhenOnline', 'toBeSaved', id).then((isHere) => {
      if (isHere) this.searchInLocalDataToBeSaved('toBeSavedWhenOnline', 'toBeSaved', id);
    })
  }

  async getLocalForgeData(variableName, localForgeString) {
    return await this[variableName].getItem(localForgeString);
  }

  async checkIfIsInLocalStore(variableName, localForgeString, idToBeFound) {
    return await this.getLocalForgeData(variableName, localForgeString).then((value) => {
      if (value && value.constructor.name === "Object")
        if (value.id === idToBeFound) return true;
      if (value && value.constructor === Array)
        if (typeof (this.returnLocalIndex(value, 'id', idToBeFound)) === 'number') return true;
    });
  }


  deleteFromLocalStore(variableName, localForgeValue, idToBeDeleted) {
    this.toDoWeek.getItem(localForgeValue, (err, value) => {
      if (value) {
        if (this.isObject(value)) {
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
    let localArray: any = array
    if (localArray.constructor === Array) {
      for (let i = 0; i < array.length; i++) {
        if (array[i][propriety] === proprietyValue) {
          return i;
        }
      }
    } else {
      return undefined;
    }

  }
}

