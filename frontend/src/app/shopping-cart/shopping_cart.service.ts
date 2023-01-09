import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

const AUTH_API = 'http://localhost:5200/buy/';

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root',
})
export class ShoppingCartService {
    constructor(private http: HttpClient) { }

    GetShoppingCart(username: string): Observable<any> {
        return this.http.get(
            AUTH_API + 'getOrder/' + username,
            httpOptions
        );
    }

    AddShoppingCart(username: string): Observable<any> {
        return this.http.post(
            AUTH_API + 'addOrder/',
            {
                username,
            },
            httpOptions
        );
    }

    AddToShoppingCart(id:string, item: string): Observable<any> {
        return this.http.post(
            AUTH_API + 'changeOrder/',
            {
                id,
                item,
            },
            httpOptions
        );
    }

    RemoveShoppingCart(id: string): Observable<any> {
        return this.http.post(
            AUTH_API + 'removeOrder/',
            {
                id,
            },
            httpOptions
        );
    }

    private _orderCount = new BehaviorSubject<OrderCount>({
        cartTotal: 0,
        product: ''
    });
      private _orderCount$ = this._orderCount.asObservable();
    
      getOrderCount(): Observable<OrderCount> {
        return this._orderCount$;
      }
    
      setOrderCount(latestValue: OrderCount) {
        console.log(latestValue);
        return this._orderCount.next(latestValue);
      }

}

interface OrderCount {
    cartTotal: number;
    product: string;
  }