import { Component, Injectable, Input, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { ShoppingCartService } from '../shopping-cart/shopping_cart.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})

@Injectable()
export class ProductComponent implements OnInit {

  //case = {} as Case;

  @Input() case = {} as Case;
  product = {} as OrderCount;

  // public item = {} as Buy;

  constructor(private shopping: ShoppingCartService) { }

  path: string = '../../assets/upload/';

  ngOnInit(): void {
  }



  BuyItem(name: string, price: string) {

      this.product = {
        cartTotal: 5,
        product: name
      }

      console.log(this.case);

      this.shopping.setOrderCount(this.product);
    
  }

}

interface OrderCount {
  cartTotal: number;
  product: string;
}

interface Case {
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

interface Buy {
  name: string,
  price: string
}

