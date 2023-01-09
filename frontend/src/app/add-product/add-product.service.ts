import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

const AUTH_API = 'http://localhost:5200/product/';

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root',
})
export class AddProductService {
    constructor(private http: HttpClient) { }

    AddProduct(CompanyName: string, PhoneModel: string, Width: string, Height: string, Thickness: string, Color: string, Availability: string, Price: string): Observable<any> {
        return this.http.post(
            AUTH_API + 'addPhones',
            {
                CompanyName,
                PhoneModel,
                Height,
                Width,
                Thickness,
                Color,
                Availability,
                Price,

            },
            httpOptions
        );
    }

}