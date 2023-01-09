import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:5200/request/';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root',
})

export class ContactService {
  constructor(private http: HttpClient) { }

  Request(phoneModule: string, width: string, height: string, thickness: string, color: string, email: string, moreInfo: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'makeReq',
      {
        phoneModule,
        width,
        height,
        thickness,
        color,
        email,
        moreInfo
      },
      httpOptions
    );
  }

}