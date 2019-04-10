import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AuthService } from './auth.service';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs';
import * as moment from "moment";
import * as localForage from "localforage";

import { OfflineDbService } from './offline-db.service';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  POSTuserTasksCollection;
  GETuserTasksCollection = new Observable<any>();
  userId;

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
        this.getLocalDBData();
      });
      this.getLocalDBData();
    }, 500)
  }
  getLocalDBData() {
    this.offline.toDoWeek.getItem('toDoWeek', (err, value) => {
      if (value && this.thisWeekTags.length == 0) {
        this.thisWeekTasks = value;
      }
    });
  }

  pushDataToUserCollection(Data) {
    this.POSTuserTasksCollection.push(Data);
    this.thisWeekTags.push(Data);

    if (this.offline.checkInternetConnection()) {
      this.offline.pushDataToOfflineDb(Data);
    }


    //   this.offline.toDoWeek.getItem('toDoWeek').then((item) => {
    //     console.log(item);
    //     let localItem: any = item;
    //     localItem.push(Data);
    //     this.offline.toDoWeek.setItem('toDoWeek', localItem).then(() => {
    //       console.log("Done!");
    //     });
    //   })
  }

  refreshOfflineDB() {
    localForage.removeItem('toDoWeek').then(() => {
      console.log("removed!")
      // this.toDoWeek.setItem('toDoWeek', this.thisWeekTasks).then(() => {
      //   this.toDoWeek.getItem('toDoWeek', (err, value) => {
      //     this.getLocalDBData();
      //     this.extractTagsFromObject(value);
      //     debugger;

      //   });
      // });
    });
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

      // this.offline.toDoWeek.setItem('toDoWeek', this.thisWeekTasks).then(() => { });
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
