import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from 'angularfire2/auth';
import { auth } from 'firebase/app';
import { Router } from '@angular/router';
import { OfflineDbService } from './offline-db.service';


declare var gapi: any;

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  user$: Observable<firebase.User>;
  user: Observable<object>;

  userId;
  userData;

  clientIsInit = new BehaviorSubject<boolean>(false);
  userIslogged = false;
  homePageInited = false;

  constructor(public afAuth: AngularFireAuth, public router: Router, private offline: OfflineDbService) {
    this.user$ = afAuth.authState;
    this.initClient();
    this.saveUserCredential();
    this.saveUserLogging(afAuth);

  }


  saveUserLogging(afAuth) {
    afAuth.user.subscribe((user) => {
      try {
        if (user.uid) {
          console.log(user);
          this.userIslogged = true;
          this.router.navigate(['toDoWeek']);
        }
      } catch (e) {
        this.userIslogged = false;
      }
    })

  }

  initClient() {
    if (this.offline.checkInternetConnection()) {
      gapi.load('client', () => {
        gapi.client.init({
          apiKey: 'AIzaSyB4KN3ZXOPArkdkGoxI4kPhDsuLipBBo5I',
          clientId: '838361556275-sua2qlbgpbqdnbfe2r80r1rli6pomjni.apps.googleusercontent.com',
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: 'https://www.googleapis.com/auth/calendar'
        })
        gapi.client.load('calendar', 'v3').then(() => {
          this.clientIsInit.next(true);
        })
      })
    }
  }
  saveUserCredential() {
    this.user$.subscribe((userData) => {
      try {
        this.userId = userData.uid;
        this.userData = userData;
      } catch{ }
    })
  }


  async login() {
    const googleAuth = gapi.auth2.getAuthInstance();
    const googleUser = await googleAuth.signIn();
    const token = googleUser.getAuthResponse().id_token;
    const credential = auth.GoogleAuthProvider.credential(token);

    await this.afAuth.auth.signInAndRetrieveDataWithCredential(credential).then(() => {
      console.log(credential);
    }
    );
  }

  logout() {
    this.afAuth.auth.signOut();
  }


  // hoursFromNow = (n) => new Date(Date.now() + n * 1000 * 60 * 60).toISOString();
  // async getCalendar() {
  //   const events = await gapi.client.calendar.events.list({
  //     calendarId: 'primary',
  //     timeMin: new Date().toISOString(),
  //     showDeleted: false,
  //     singleEvents: true,
  //     maxResults: 10,
  //     orderBy: 'startTime'
  //   })
  // }
  getGapiInstance() {
    return gapi;
  }

}
