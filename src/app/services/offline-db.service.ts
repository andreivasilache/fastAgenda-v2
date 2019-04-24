import { Injectable } from '@angular/core';

import * as localForage from "localforage";

@Injectable({
  providedIn: 'root'
})

export class OfflineDbService {
  toDoWeek = localForage.createInstance({ name: 'toDoWeek' });
  toBeSavedWhenOnline = localForage.createInstance({ name: 'toBeSaved' });
  toBeDeletedWhenOnline = localForage.createInstance({ name: 'toBeDeleted' });
  toBeUpdatedStatusWhenOnline = localForage.createInstance({ name: 'toBeUpdatedStatus' });

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
    return item && item.constructor.name === "Object";
  }

  isArray(item) {
    return item && item.constructor === Array;
  }

  clearCollection(variableName) {
    this[variableName].clear()
  }

  pushDataToOfflineDb(variableLocalForgeName, variableName, data) {
    this[variableName].getItem(variableLocalForgeName).then((item) => {
      if (item != null && item.constructor === Array) {
        let localItem: any = item;
        localItem.push(data);
        this.saveLocal(variableLocalForgeName, variableName, localItem);
      }
      else if (item != null && typeof (item) === 'object') {
        let localItem = [];
        localItem.push(item);
        localItem.push(data);
        this.saveLocal(variableLocalForgeName, variableName, localItem);
      }
      else
        this.saveLocal(variableLocalForgeName, variableName, data);
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
    await this.checkIfIsInLocalStore('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus', id).then(isHere => {
      if (isHere) {
        this.deleteFromLocalDBById('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus', id);
      }
    })
  }

  deleteFromLocalDBById(variableName, variableNameString, id) {
    this[variableName].getItem(variableNameString, (err, value) => {
      if (this.isArray(value)) {
        let localArray: any = value;
        let localIndex = this.returnLocalIndex(value, 'id', id);
        localArray.splice(localIndex, 1);
        this.saveLocal(variableNameString, variableName, localArray);
      }
      if (this.isObject(value)) {
        this.clearCollection(variableName);
      }
    });
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
    this[variableName].getItem(localForgeValue, (err, value) => {
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
    console.log(variableName);
    this[variableName].getItem(localForgeValue, (err, value) => {
      if (value) {
        let deleted = value.splice(localArrayIndex, 1);
        this.saveLocal(localForgeValue, variableName, value);
        if (variableName === "toDoWeek") this.pushDataToBeDeletedLocal(deleted);
      }
    });
  };

  pushDataToBeDeletedLocal(deletedElement) {
    this.toBeDeletedWhenOnline.getItem('toBeDeletedWhenOnline', (err, toBeDeletedValue) => {
      if (toBeDeletedValue) {
        let localToBeDeleted: any = toBeDeletedValue;
        if (localToBeDeleted.constructor.name === "Object") {
          let localArray = [];
          localArray.push(localToBeDeleted);
          localArray.push(deletedElement);
          this.saveLocal('toBeDeletedWhenOnline', 'toBeDeletedWhenOnline', localArray);
        } else {
          localToBeDeleted.push(deletedElement[0]);
          this.saveLocal('toBeDeletedWhenOnline', 'toBeDeletedWhenOnline', localToBeDeleted);
        }
      } else {
        this.saveLocal('toBeDeletedWhenOnline', 'toBeDeletedWhenOnline', deletedElement);
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

  async searchByIDAndReturnValue(variableName, localForgeValue, id) {
    await this[variableName].getItem(localForgeValue).then((data) => {
      let recivedData: any = data;
      if (this.isObject(recivedData)) {
        if (recivedData.id == id) return recivedData.status;
      }
      if (this.isArray(recivedData)) {
        for (let itterator = 0; itterator < recivedData.length; itterator++) {
          if (recivedData[itterator].id == id) return recivedData[itterator].status;
        }
      }
    });
  }


  saveUpdateInLocalStorage(idOfTask, newData) {
    this.checkIfIsInLocalStore('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus', idOfTask).then((isHere) => {
      if (isHere) {
        this.getLocalForgeData('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus').then((data) => {
          if (this.isArray(data)) {
            let localArray = data;
            let indexInArray = this.returnLocalIndex(data, 'id', idOfTask);
            if (localArray[indexInArray].haveCheckBox) {
              localArray[indexInArray].checkBoxQuantityRealized = newData;
            } else {
              localArray[indexInArray].status = !newData;
            }
            this.saveLocal('toBeUpdatedStatus', 'toBeUpdatedStatusWhenOnline', localArray);
          }
          if (this.isObject(data)) {
            data.status = newData;
            this.saveLocal('toBeUpdatedStatus', 'toBeUpdatedStatusWhenOnline', data);
          }
        })
      } else {
        this.pushDataToOfflineDb('toBeUpdatedStatus', 'toBeUpdatedStatusWhenOnline', {
          id: idOfTask,
          status: newData
        });
      }
    });
  }
}

