import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ToDoWeekComponent } from './to-do-week/to-do-week.component';
import { ThisWeekTasksComponent } from './to-do-week/this-week-tasks/this-week-tasks.component';
import { SummaryComponent } from './to-do-week/summary/summary.component';
import { AuthGuardService } from './auth-guards/auth-guard.service';
import { LoginErrorComponent } from './page-error/login-error/login-error.component';

const routes: Routes = [
  { path: 'loginErr', component: LoginErrorComponent },
  { path: 'today', component: HomeComponent, canActivate: [AuthGuardService] },
  {
    path: 'toDoWeek', component: ToDoWeekComponent, canActivate: [AuthGuardService],
    children: [
      { path: '', component: ThisWeekTasksComponent, pathMatch: 'full' },
      { path: 'summary', component: SummaryComponent }
    ]
  },
  { path: '**', redirectTo: 'toDoWeek' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
