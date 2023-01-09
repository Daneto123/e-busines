import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ShoppingCartService } from './shopping_cart.service';

import { ProductComponent } from '../product/product.component'
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {

  @Input() username:string = '';

  list: string[] = [];
  idCart: string = '';
  cartTotal: number = 0;
  lenght: number = this.list.length;
  subscription: Subscription = new Subscription();

  constructor(private shopping: ShoppingCartService) {
    // this.shopping.GetShoppingCart(this.username).subscribe((order) => {
    //   this.list = <string[]>JSON.parse(order.order);
    //   this.idCart = order.id;
    // });
  }

  
  ngOnInit() {
    this.subscription = this.shopping
      .getOrderCount()
      .subscribe((orderCount) => {
        this.cartTotal += orderCount.cartTotal;
        this.list.push(orderCount.product);
        
        this.shopping.GetShoppingCart(this.username).subscribe((order) => {
            const listche = <string[]>JSON.parse(order[0].order);
            this.idCart = order[0].id;

            listche.forEach(element => {
              if(element != null){
                this.list.push(Object.values(element)[0]);
              }
            });
            console.log(Object.values(this.list[2]))
            //console.log(order[0].id)
            //console.log(order)
          });

        if(this.list.length == 1) {
         this.shopping.AddShoppingCart(this.username);
        } else {
          this.shopping.AddToShoppingCart(this.username, "{ " + orderCount.product + ":" + orderCount.cartTotal + " }")
        }

      });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  Remove(){
    this.shopping.RemoveShoppingCart(this.idCart);
  }

}

interface Case {
  name: string,
  price: string
}
