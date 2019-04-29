import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthService } from './auth.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs';
import * as moment from "moment";
import { OfflineDbService } from './offline-db.service';
import { take } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  POSTuserTasksCollection;
  GETuserTasksCollection = new Observable<any>();

  userId;
  checkConnectionInterval;

  thisWeekTasks: any = [];

  DBTasks = [];
  thisWeekTags = [];
  emptyArrayForTextHovering = [];
  tasksGroupedByWeek = [];

  constructor(public db: AngularFireDatabase, public auth: AuthService, public firebaseAuth: AngularFireAuth, private offline: OfflineDbService) {

    this.offlineOpperations();

    setTimeout(() => {
      let subscriber = firebaseAuth.authState.subscribe((userData) => {

        let localUid = userData.uid;
        this.userId = localUid;

        this.POSTuserTasksCollection = this.db.list(`/weekly-tasks/${userData.uid}`);
        this.GETuserTasksCollection = this.db.object(`/weekly-tasks/${userData.uid}`).valueChanges();

        this.getUserDataForThisWeek();
        subscriber.unsubscribe();

      });

      let number = 0;
      this.checkConnectionInterval = setInterval(() => {

        if (this.offline.checkInternetConnection()) {
          this.pushOfflineStoredDataWhenConnection();
          this.deleteOfflineStoredDataWhenConnection();
          number === 1 ? clearInterval(this.checkConnectionInterval) : number++;

        }
      }, 1000)
    }, 500)
  }


  offlineOpperations() {
    this.getLocalDBData();
    this.getNotDBSavedData();
    setTimeout(() => {
      if (!this.offline.checkInternetConnection())
        this.updateTaskStatusFromLocalDb();
    }, 200);
  }

  updateTaskStatusFromLocalDb() {
    for (let index = 0; index < this.thisWeekTasks.length; index++) {
      this.offline.searchByIDAndReturnValue('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus', this.thisWeekTasks[index].id).then((recivedData) => {
        let recivedStatus: any = recivedData;
        if (recivedStatus != undefined && typeof (recivedStatus) === 'boolean') {
          this.thisWeekTasks[index].taskRealized = recivedStatus;
        }
        if (recivedStatus != undefined && typeof (recivedStatus) === 'number') {
          this.thisWeekTasks[index].checkBoxQuantityRealized = recivedStatus;
        }
      })
    }
  }

  generateRandomId() {
    return Math.random().toString(16).slice(2) + (new Date()).getTime() + Math.random().toString(16).slice(2);
  }

  getLocalDBData() {
    this.offline.toDoWeek.getItem('toDoWeek', (err, value) => {
      if (value && this.thisWeekTags.length == 0) {
        this.thisWeekTasks = [];
        this.thisWeekTasks = value;
        this.extractTagsFromObject(this.thisWeekTasks);
      }
    });
  }

  checkLocalDBStatusMatch() {
    this.returnAllEventsFromDB().then((data) => { // online data
      let onlineData: any = data;
      for (let indexTask = 0; indexTask < this.thisWeekTasks.length; indexTask++) { // offline data
        for (let onlineIndex = 0; onlineIndex < onlineData.length; onlineIndex++) {
          if (onlineData[onlineIndex].id === this.thisWeekTasks[indexTask].id || onlineData[onlineIndex].offlineGeneratedId === this.thisWeekTasks[indexTask].id
          ) {
            if (onlineData[onlineIndex].haveCheckBox
              && onlineData[onlineIndex].checkBoxQuantityRealized != this.thisWeekTasks[indexTask].checkBoxQuantityRealized) {
              console.log(this.thisWeekTasks[indexTask].checkBoxQuantityRealized);
              this.db.object(`/weekly-tasks/${this.userId}/${onlineData[onlineIndex].id}`).update({ checkBoxQuantityRealized: this.thisWeekTasks[indexTask].checkBoxQuantityRealized });
            }
            if (!onlineData[onlineIndex].haveCheckBox
              && onlineData[onlineIndex].taskRealized != this.thisWeekTasks[indexTask].taskRealized) {
              console.log(this.thisWeekTasks[indexTask].taskRealized)
              this.db.object(`/weekly-tasks/${this.userId}/${onlineData[onlineIndex].id}`).update({ taskRealized: this.thisWeekTasks[indexTask].taskRealized });
            }
          }
        }
      }
    })
  }

  async returnAllEventsFromDB() {
    let localData = [];
    return new Promise((resolve, reject) => {
      this.db.object(`/weekly-tasks/${this.userId}`).valueChanges().pipe(take(1)).subscribe(data => {
        this.sendDataObjectWithProprietyToArray(data, localData, 'id');
        this.checkOfflineMatchToBeUpdated(this.thisWeekTasks);
        resolve(localData);
      }, reject)
    })
  }

  checkOfflineMatchToBeUpdated(array) {
    let onlineArray: any = array;
    this.offline.getLocalForgeData('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus').then(toBeUpdatedData => {
      let localData: any = toBeUpdatedData;
      for (let onlineIndex = 0; onlineIndex < array.length; onlineIndex++) {
        for (let localIndex = 0; localIndex < localData.length; localIndex++) {
          if (onlineArray[onlineIndex].id === localData[localIndex].id || onlineArray[onlineIndex].offlineGeneratedId === localData[localIndex].id) {
            if (onlineArray[onlineIndex].haveCheckBox) {
              array[onlineIndex].checkBoxQuantityRealized = localData[localIndex].checkBoxQuantityRealized;
            }
            if (!onlineArray[onlineIndex].haveCheckBox) {
              array[onlineIndex].taskRealized = localData[localIndex].taskRealized;
            }
          }
        }
      }

      console.log(array);
      console.log(toBeUpdatedData);
    })
  }

  getNotDBSavedData() {
    this.offline.toBeSavedWhenOnline.getItem('toBeSaved', (err, value) => {
      let localValue: any = value;
      if (value) {
        if (localValue.constructor.name == "Object") {
          this.thisWeekTasks.push(localValue);
        } else {
          localValue.forEach(element => { this.thisWeekTasks.push(element); });
        }
        this.extractTagsFromObject(this.thisWeekTasks);
      }
    });
  }

  pushDataOffline(Data) {
    this.offline.pushDataToOfflineDb('toBeSaved', 'toBeSavedWhenOnline', Data);
    this.sortUniqueTags(this.thisWeekTags);
  }

  deleteOfflineStoredDataWhenConnection() {
    this.offline.toBeDeletedWhenOnline.getItem('toBeDeletedWhenOnline', (err, value) => {
      let localValue: any = value;
      if (value) {
        if (localValue.constructor.name == "Object") {
          this.deleteTaskFromCollection(localValue.id);
        } else {
          localValue.forEach(element => this.deleteTaskFromCollection(element.id));
        }
        this.offline.clearCollection('toBeDeletedWhenOnline');
      }
    })
  }

  pushOfflineStoredDataWhenConnection() {
    let i = 0;
    this.offline.toBeSavedWhenOnline.getItem('toBeSaved', (err, value) => {
      let localValue: any = value;
      if (value) {
        if (localValue.constructor.name == "Object") {
          this.offline.searchByIDAndReturnValue('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus', localValue.id).then((returnedValue) => {
            let recivedStatus: any = returnedValue;
            if (recivedStatus != undefined && typeof (recivedStatus) === 'boolean') {
              localValue.taskRealized = recivedStatus;
            }
            if (recivedStatus != undefined && typeof (recivedStatus) === 'number') {
              localValue.checkBoxQuantityRealized = recivedStatus;
            }
          }).then(() => { this.POSTuserTasksCollection.push(localValue); })
        }
        else {
          for (let itterator = 0; itterator < localValue.length; itterator++) {
            this.offline.searchByIDAndReturnValue('toBeUpdatedStatusWhenOnline', 'toBeUpdatedStatus', localValue[itterator].id).then((returnedValue) => {
              let recivedStatus: any = returnedValue;
              console.log({ recivedStatus })
              if (recivedStatus != undefined && typeof (recivedStatus) === 'boolean') {
                localValue[i].taskRealized = recivedStatus;
                console.log(localValue[i].taskRealized)
              }
              if (recivedStatus != undefined && typeof (recivedStatus) === 'number') {
                localValue[i].checkBoxQuantityRealized = recivedStatus;
              }
            })
            this.POSTuserTasksCollection.push(localValue[i])
          }
        }
      }
      this.offline.clearCollection('toBeSavedWhenOnline');
    });
  }



  pushDataToUserCollection(Data) {
    if (this.offline.checkInternetConnection()) {
      this.POSTuserTasksCollection.push(Data);
    } else this.pushDataOffline(Data)
    this.thisWeekTasks.push(Data);
  }

  sendDataObjectWithProprietyToArray(obj, arr, propriety) {
    arr.length = 0;
    for (let prop in obj) {
      let objectElement = obj[prop];
      objectElement[propriety] = prop;
      arr.push(objectElement)
    }
  }

  sortUniqueTags(arrToBeFiltered) {
    let unqiue = arrToBeFiltered.filter((v, i, a) => a.indexOf(v) === i);
    this.thisWeekTags = unqiue;
  }

  updateDBCollectionCheckbox(id, newContent, index) {
    if (this.offline.checkInternetConnection()) {
      this.db.object(`/weekly-tasks/${this.userId}/${id}`).update({ checkBoxQuantityRealized: newContent });
    } else {
      this.offline.saveUpdateInLocalStorage(id, newContent, true);
      this.updateLocalArrayStatus(index, newContent, true);
    }
  }

  updateDBCollectionTaskStatusToggle(id, status, index) {
    if (this.offline.checkInternetConnection()) {
      this.db.object(`/weekly-tasks/${this.userId}/${id}`).update({ taskRealized: !status });
    } else {
      this.offline.saveUpdateInLocalStorage(id, status, false);
      this.updateLocalArrayStatus(index, status, false);
    }
  }

  hideAllDeleteButtons(arr) {
    for (let i = 0; i <= arr.length; i++) {
      this.emptyArrayForTextHovering[i] = false;
    }
  }

  getUserDataForThisWeek() {
    this.checkLocalDBStatusMatch();
    this.GETuserTasksCollection.subscribe((userData) => {
      this.sendDataObjectWithProprietyToArray(userData, this.DBTasks, 'id');
      this.extractThisWeekTasks(this.DBTasks);
      this.extractTagsFromObject(this.thisWeekTasks);
      this.groupObjBy(this.DBTasks, 'weekStartDate');
      this.sortSumarryByDate();
      this.offline.saveLocal('toDoWeek', 'toDoWeek', this.thisWeekTasks);
      // this.offline.saveToDoWeekData(this.thisWeekTasks);
    });
    console.log(this.thisWeekTasks);
  }

  sortSumarryByDate(): void {
    this.tasksGroupedByWeek.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  }

  groupObjBy(array, property) {
    let hash = {};
    for (var i = 0; i < array.length; i++) {
      if (!hash[array[i][property]]) hash[array[i][property]] = [];
      hash[array[i][property]].push(array[i]);
    }
    this.sendDataObjectWithProprietyToArray(hash, this.tasksGroupedByWeek, 'weekStartDate');
  }

  extractThisWeekTasks(objArr) {
    this.thisWeekTasks = [];
    let startOfTheWeekDatISO = moment().startOf('isoWeek').toDate().toISOString();
    for (let prop in objArr) {
      if (objArr[prop].weekStartDate == startOfTheWeekDatISO) {
        this.thisWeekTasks.push(objArr[prop]);
      }
    }
  }

  extractTagsFromObject(object) {
    let allTags = [];
    for (let prop in object) {
      allTags.push(object[prop]['tag']);
    }
    this.sortUniqueTags(allTags);
  }

  deleteTaskFromCollection(id) {
    this.db.object(`/weekly-tasks/${this.userId}/${id}`).remove()
  }

  deleteTask(id, index) {
    if (!this.offline.checkInternetConnection()) {
      this.offline.deleteOffline(id).then(() => {
        this.deleteFromThisWeekTasksByIndex(index);
        this.extractTagsFromObject(this.thisWeekTasks);
      });
    } else {
      this.db.object(`/weekly-tasks/${this.userId}/${id}`).remove()
    }
  }

  deleteFromThisWeekTasksByIndex(index) {
    this.thisWeekTasks.splice(index, 1);
  }

  updateLocalArrayStatus(indexOfArray, status, haveCheckBox) {
    if (haveCheckBox) {
      this.thisWeekTasks[indexOfArray].checkBoxQuantityRealized = status;
    } else {
      this.thisWeekTasks[indexOfArray].taskRealized = !status;
    }
  }
}
