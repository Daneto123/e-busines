import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:5200/search/';

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root',
})

export class SearchService {

    constructor(private http: HttpClient) { }

    SearchByName(name: string): Observable<any> {
        return this.http.get<Phone[]>(
            AUTH_API + 'phonesByName/' + name
        );
    }

    SearchBySize(width: string, height: string, thickness: string): Observable<any> {
        return this.http.get<Phone[]>(
            AUTH_API + 'phonesBySize/' + height + '/' + width + '/' + thickness
        );
    }

    SearchAllPhones(): Observable<Phone[]> {
        return this.http.get<Phone[]>('http://localhost:5200/phones');
    }

}

interface Phone {
    name: string,
    width: string,
    height: string,
    thickness: string,
    color: string,
    company: string,
    availability: string,
    price: string,
    avatar: string
}