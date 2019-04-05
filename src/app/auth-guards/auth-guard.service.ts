import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
// import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { AngularFireAuth } from 'angularfire2/auth';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(public auth: AngularFireAuth, public router: Router) {
  }


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.auth.authState.pipe(
      take(1),
      map(authState => !!authState),
      tap(auth => !auth ? this.router.navigate(['loginErr']) : true)
    )
  }
}
