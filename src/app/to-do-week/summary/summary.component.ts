import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.sass']
})
export class SummaryComponent implements OnInit {

  constructor(public db: DatabaseService) { }
  createLenghtArray(value) {
    let localArray = [];
    for (let i = 1; i <= value; i++) {
      localArray.push(i)
    }
    return localArray;
  }

  ngOnInit() {
  }

}
