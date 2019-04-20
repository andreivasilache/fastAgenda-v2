import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { OfflineDbService } from '../services/offline-db.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  navbarToggled: boolean = false;

  constructor(public auth: AuthService, private offline: OfflineDbService) { }

  toggleNavbar() {
    this.navbarToggled = !this.navbarToggled;
  }

  logOut() {
    this.auth.logout();
  }

  logIn() {
    this.auth.login();
  }

  ngOnInit() {
  }

}
