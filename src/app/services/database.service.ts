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
    setTimeout(() => {
      let subscriber = firebaseAuth.authState.subscribe((userData) => {
        this.POSTuserTasksCollection = this.db.list(`/weekly-tasks/${userData.uid}`);
        this.GETuserTasksCollection = this.db.object(`/weekly-tasks/${userData.uid}`).valueChanges();
        this.userId = userData.uid;
        this.getUserDataForThisWeek();
        subscriber.unsubscribe();
      });
      this.checkConnectionInterval = setInterval(() => {
        if (this.offline.checkInternetConnection()) {
          this.pushOfflineStoredDataWhenConnection();
          this.deleteOfflineStoredDataWhenConnection();
        }
      }, 1000)
      this.offlineOpperations();
    }, 500)
  }


  offlineOpperations() {
    this.getLocalDBData();
    this.getNotDBSavedData();
  }

  generateRandomId() {
    return Math.random().toString(16).slice(2) + (new Date()).getTime() + Math.random().toString(16).slice(2);
  }

  getLocalDBData() {
    this.offline.toDoWeek.getItem('toDoWeek', (err, value) => {
      if (value && this.thisWeekTags.length == 0) {
        this.thisWeekTasks = value;
        this.extractTagsFromObject(this.thisWeekTasks);
      }
    });
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
    this.offline.pushDataToOfflineDb(Data);
    this.sortUniqueTags(this.thisWeekTags);
  }

  deleteOfflineStoredDataWhenConnection() {
    this.offline.toBeDeletedWhenOffline.getItem('toBeDeletedWhenOffline', (err, value) => {
      let localValue: any = value;
      if (value) {
        if (localValue.constructor.name == "Object") {
          this.deleteTaskFromCollection(localValue.id);
        } else {
          localValue.forEach(element => this.deleteTaskFromCollection(element.id));
        }
        this.offline.clearCollection('toBeDeletedWhenOffline');
      }
    })
  }

  pushOfflineStoredDataWhenConnection() {
    let i = 0;
    this.offline.toBeSavedWhenOnline.getItem('toBeSaved', (err, value) => {
      let localValue: any = value;
      if (value) {
        if (localValue.constructor.name == "Object") {
          this.POSTuserTasksCollection.push(value);
          console.log("Added object")
        }
        else {
          localValue.forEach(element => { this.POSTuserTasksCollection.push(element) });
        }
        this.offline.clearCollection('toBeSavedWhenOnline');
      }
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
      this.offline.saveLocal('toDoWeek', 'toDoWeek', this.thisWeekTasks);
      // this.offline.saveToDoWeekData(this.thisWeekTasks);
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


}
