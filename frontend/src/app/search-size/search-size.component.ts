import { Component, OnInit } from '@angular/core';
import { SearchService } from '../search/search.service';
import {FormControl} from '@angular/forms';

import { ProductComponent } from '../product/product.component';
import { Observable } from 'rxjs';
import {tap, filter, map, startWith} from 'rxjs/operators';
import { DOWN_ARROW, UP_ARROW } from '@angular/cdk/keycodes'

export interface User {
  name: string;
}

@Component({
  selector: 'app-search-size',
  templateUrl: './search-size.component.html',
  styleUrls: ['./search-size.component.css']
})
export class SearchSizeComponent implements OnInit {

  bySize: any = {
    height: null,
    width: null,
    thickness: null
  };

  findPhones: Phone[] = [];
  isFind = false;
  Case = {} as Phone;

  isOn = false;

  errorMessage: string = '';

  path: string = '../../../../backend/images/upload/';

  constructor(private search: SearchService, private product: ProductComponent) { }

  ngOnInit() { }

  onSubmitBySize(): void {
    const { height, width, thickness } = this.bySize;

    this.search.SearchBySize(height, width, thickness).subscribe({
      next: data => {
        console.log(data);
        this.findPhones = data;
        this.isFind = true;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  showProduct(name: string,
    width: string,
    height: string,
    thickness: string,
    color: string,
    company: string,
    availability: string,
    price: string,
    avatar: string): void {

      this.Case = {
        name: name,
        width: width,
        height: height,
        thickness: thickness,
        color: color,
        company: company,
        availability: availability,
        price: price,
        avatar: avatar
      }

      console.log(this.Case)


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
