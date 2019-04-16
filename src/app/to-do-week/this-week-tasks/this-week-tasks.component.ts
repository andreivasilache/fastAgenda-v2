import { Component, OnInit } from '@angular/core';
import { WeekTask } from 'src/app/models/week-task.model';
import { DatabaseService } from 'src/app/services/database.service';
import { MatDialog } from '@angular/material';
import { MatDialogComponent } from 'src/app/mat-dialog/mat-dialog.component';
import * as moment from "moment";
import { OfflineDbService } from 'src/app/services/offline-db.service';

@Component({
  selector: 'app-this-week-tasks',
  templateUrl: './this-week-tasks.component.html',
  styleUrls: ['./this-week-tasks.component.sass']
})
export class ThisWeekTasksComponent implements OnInit {

  newEventFormToggler = false;
  toggleCheckboxInput = false;
  tagFormValue = '';
  clickedTag;

  dbTasks: WeekTask[];
  nextWeeks = [];
  selectedWeek = this.startOfWeekIso();

  constructor(public db: DatabaseService, private offlineDb: OfflineDbService, private dialog: MatDialog) {
    this.generateNextWeeks(7);
  }

  ngOnInit() {
  }
  startOfWeekIso() {
    return moment().startOf('isoWeek').toDate().toISOString();
  }
  endOfWeekIso() {
    return moment().endOf('isoWeek').toDate().toISOString();
  }

  generateNextWeeks(numberOfWeeks) {
    let currentWeek = moment();
    let itteratorWeek;
    let itterator = 0;
    this.nextWeeks.push({
      startOfWeek: this.startOfWeekIso(),
      endOfWeek: this.endOfWeekIso()
    })

    while (itterator <= numberOfWeeks) {
      itteratorWeek = currentWeek.startOf('isoWeek').add(1, 'w');
      this.nextWeeks.push({
        startOfWeek: itteratorWeek.startOf('isoWeek').toISOString(),
        endOfWeek: itteratorWeek.endOf('isoWeek').toISOString()
      })

      itterator++;
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(MatDialogComponent, {
      width: '350px',
    });

    dialogRef.afterClosed().subscribe(result => {
      return result == 'confirm' ? true : false;
    });
  }

  createLenghtArray(value) {
    let localArray = [];
    for (let i = 1; i <= value; i++) {
      localArray.push(i)
    }
    return localArray;
  }

  elementIsInArray(array, element) {
    let wasFound = array.filter((arrElement) => arrElement == element);
    return wasFound.length != 0 ? true : false;
  }
  toggleCheckBox(elementId, actualQuantity, isChecked) {
    let incraseOrDecraseQuantity = isChecked ? actualQuantity - 1 : actualQuantity + 1;
    this.db.updateDBCollectionCheckbox(elementId, incraseOrDecraseQuantity);
  }

  toggleTaskStatus(elementId, currentStatus, haveCheckBox) {
    if (!haveCheckBox) {
      if (currentStatus === false) {
        this.db.updateDBCollectionTaskStatusToggle(elementId, currentStatus);
      } else {
        const dialogRef = this.dialog.open(MatDialogComponent, {
          width: '350px',
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result == 'confirm')
            this.db.updateDBCollectionTaskStatusToggle(elementId, currentStatus);
        });
      }
    }
  }

  toggleSortByTag(tag) {
    if (this.clickedTag === tag) this.clickedTag = undefined;
    else this.clickedTag = tag;
  }

  sortNgIfByTag(htmlTag) {
    if (typeof (this.clickedTag) == 'undefined') return true;
    if (this.clickedTag === htmlTag) return true;
  }

  addTask(value) {
    value.taskRealized = false;
    let startOfThisWeek = this.startOfWeekIso();
    let isThisWeek = value.selectedWeekForm === startOfThisWeek ? true : false;


    value.weekStartDate = isThisWeek ? startOfThisWeek : moment(value.selectedWeekForm).toISOString();
    value.weekEndDate = isThisWeek ? this.endOfWeekIso() : moment(value.selectedWeekForm).endOf('week').toISOString();

    delete value.selectedWeek;

    if (value.haveCheckBox) {
      value.checkBoxQuantityRealized = 0;
      value.checkBoxQuantity = Number(value.checkBoxQuantity);
    }
    if (!this.offlineDb.checkInternetConnection()) {
      value.id = this.db.generateRandomId();
      value.savedOffline = true;
    }


    if (!this.elementIsInArray(this.db.thisWeekTags, value.tag)) this.db.thisWeekTags.push(value.tag);
    this.db.pushDataToUserCollection(value);
    this.newEventFormToggler = !this.newEventFormToggler;
  }

  deleteTask(taskId, index) {
    const dialogRef = this.dialog.open(MatDialogComponent, {
      width: '350px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == 'confirm')
        this.db.deleteTask(taskId, index);
    });
  }

}
