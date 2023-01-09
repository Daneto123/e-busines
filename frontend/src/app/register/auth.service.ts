import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:5200/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.get<any>(
      AUTH_API + 'authentication/' + 'auth/' + username + "/" + password
    );

  }

  register(username: string, email: string, password: string, repassword: string, type: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'user/' + 'r',
      {
        username,
        password,
        email,
        repassword,
        type
      },
      httpOptions
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'logout', { }, httpOptions);
  }
}