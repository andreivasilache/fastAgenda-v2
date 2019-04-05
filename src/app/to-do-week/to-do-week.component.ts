import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-to-do-week',
  templateUrl: './to-do-week.component.html',
  styleUrls: ['./to-do-week.component.sass']
})


export class ToDoWeekComponent implements OnInit {

  summaryText = "Summary";

  toggleSummary() {
    if (this.router.url == "/toDoWeek/summary") {
      this.router.navigate(['/toDoWeek'])
      this.summaryText = "Summary"

    }
    if (this.router.url == "/toDoWeek") {
      this.router.navigate(['/toDoWeek/summary'])
      this.summaryText = "This Week"
    }
  }

  constructor(private router: Router) {
  }

  ngOnInit() {

  }


}
