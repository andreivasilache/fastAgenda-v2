import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { HomeComponent } from './home/home.component';
import { FormsModule } from '@angular/forms';
import { ToDoWeekComponent } from './to-do-week/to-do-week.component';
import { AngularFireDatabaseModule } from 'angularfire2/database';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule, MatSelectModule, MatCheckboxModule, MatDialogModule } from '@angular/material';
import { MatDialogComponent } from './mat-dialog/mat-dialog.component';
import { ThisWeekTasksComponent } from './to-do-week/this-week-tasks/this-week-tasks.component';
import { SummaryComponent } from './to-do-week/summary/summary.component';
import { LoginErrorComponent } from './page-error/login-error/login-error.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    ToDoWeekComponent,
    MatDialogComponent,
    ThisWeekTasksComponent,
    SummaryComponent,
    LoginErrorComponent,
  ],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    AngularFireDatabaseModule,
    MatFormFieldModule,
    MatInputModule,
    BrowserAnimationsModule,
    MatSelectModule,
    MatCheckboxModule,
    AngularFireModule.initializeApp({
      apiKey: "AIzaSyB4KN3ZXOPArkdkGoxI4kPhDsuLipBBo5I",
      authDomain: "fastagenda-1cdc8.firebaseapp.com",
      databaseURL: "https://fastagenda-1cdc8.firebaseio.com",
      projectId: "fastagenda-1cdc8",
      storageBucket: "fastagenda-1cdc8.appspot.com",
      messagingSenderId: "838361556275",
    }),
    AngularFireAuthModule,
    MatDialogModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  entryComponents: [
    MatDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
