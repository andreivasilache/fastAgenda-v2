import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthService } from './auth.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs';
import * as moment from "moment";

import { OfflineDbService } from './offline-db.service';


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
    // this.offline.getDoToWeekData();
    setTimeout(() => {
      let subscriber = firebaseAuth.authState.subscribe((userData) => {
        this.POSTuserTasksCollection = this.db.list(`/weekly-tasks/${userData.uid}`);
        this.GETuserTasksCollection = this.db.object(`/weekly-tasks/${userData.uid}`).valueChanges();
        this.userId = userData.uid;
        this.getUserDataForThisWeek();
        subscriber.unsubscribe();
      });
      this.offlineOpperations();
    }, 500)
  }

  offlineOpperations() {
    this.checkConnectionInterval = setInterval(() => { this.pushOfflineStoredDataWhenConnection() }, 1000)
    this.getLocalDBData();
    this.getNotDBSavedData();
  }


  getLocalDBData() {
    this.offline.toDoWeek.getItem('toDoWeek', (err, value) => {
      if (value && this.thisWeekTags.length == 0) {
        this.thisWeekTasks = value;
      }
    });
  }

  getNotDBSavedData() {
    this.offline.toBeSavedWhenOnline.getItem('toBeSaved', (err, value) => {
      let localValue: any = value;
      if (value) {
        if (typeof (localValue) === 'object') {
          console.log('object')
          this.thisWeekTasks.push(localValue);
        } else {
          console.log('vector')
          localValue.forEach(element => { this.thisWeekTasks.push(element); console.log(element) });
        }

      }
    });
  }

  pushDataOffline(Data) {
    this.offline.pushDataToOfflineDb(Data);
  }

  pushOfflineStoredDataWhenConnection() {
    let i = 0;
    if (this.offline.checkInternetConnection()) {
      this.offline.toBeSavedWhenOnline.getItem('toBeSaved', (err, value) => {
        let localValue: any = value;
        if (value) {
          if (localValue.constructor.name == "Object") {
            this.POSTuserTasksCollection.push(value);
            console.log("Added object")
          }
          else {
            localValue.forEach(element => { this.POSTuserTasksCollection.push(element); i++; console.log("Added array element nr " + i) });
          }
          this.offline.clearCollection('toBeSavedWhenOnline');
        }
      });
    }
  }

  pushDataToUserCollection(Data) {
    this.POSTuserTasksCollection.push(Data);
    this.thisWeekTasks.push(Data);
    if (!this.offline.checkInternetConnection()) this.pushDataOffline(Data);
  }

  sendDataObjectWithProprietyToArray(obj, arr, propriety) {
    arr.length = 0;
    for (let prop in obj) {
      let objectElement = obj[prop];
      objectElement[propriety] = prop;
      arr.push(objectElement)
    }
  }

  getUniqueArrayData(arrToBeFiltered) {
    let unqiue = arrToBeFiltered.filter((v, i, a) => a.indexOf(v) === i);
    this.thisWeekTags = unqiue;
  }

  updateDBCollectionCheckbox(id, newContent) {
    this.db.object(`/weekly-tasks/${this.userId}/${id}`).update({ checkBoxQuantityRealized: newContent });
  }

  updateDBCollectionTaskStatusToggle(id, status) {
    this.db.object(`/weekly-tasks/${this.userId}/${id}`).update({ taskRealized: !status });
  }

  hideAllDeleteButtons(arr) {
    for (let i = 0; i <= arr.length; i++) {
      this.emptyArrayForTextHovering[i] = false;
    }
  }

  getUserDataForThisWeek() {
    this.GETuserTasksCollection.subscribe((userData) => {
      this.sendDataObjectWithProprietyToArray(userData, this.DBTasks, 'id');
      this.extractThisWeekTasks(this.DBTasks);
      this.extractTagsFromObject(this.thisWeekTasks);
      this.groupObjBy(this.DBTasks, 'weekStartDate');
      this.sortSumarryByDate();
      this.offline.saveToDoWeekData(this.thisWeekTasks);
    });
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
    let startOfTheWeekDatISO = moment().startOf('week').add('d', 1).toDate().toISOString();
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
    this.getUniqueArrayData(allTags);
  }

  deleteTask(id) {
    this.db.object(`/weekly-tasks/${this.userId}/${id}`).remove();
  }
}
