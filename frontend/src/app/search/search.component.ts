import { Component, OnInit } from '@angular/core';
import { SearchService } from './search.service';
import {FormControl} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { ProductComponent } from '../product/product.component';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter, elementAt, startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';


export interface User {
  name: string;
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})

export class SearchComponent implements OnInit {

  byName: any = {
    nameofPhone: null
  };

  findPhones: Phone[] = [];
  allPhones: Phone[] = [];
  //namePhones: string[] = [];
  namePhones: string[] = [];
  filteredTags: any;

  path: string = '../../assets/upload/';

  isFind = false;
  Case = {} as Phone;
  isOn = false;
  errorMessage: string = '';
  isOnSearch = false;
  isSearch = true;

  constructor(private search: SearchService, private product: ProductComponent, private http: HttpClient) { 
    search.SearchAllPhones().subscribe(data => {
      this.allPhones = data;
      //console.log(this.allPhones)

      this.allPhones.forEach(element => {
        //console.log(element.name)
        this.namePhones.push(element.name);
      });
    });

  }

  change() {
    this.isOnSearch = true;
    this.isSearch = false;
  }

  onKeydown(event: any) {
    if (event.key === "Enter") {
      console.log(event.target.value);

      this.search.SearchByName(event.target.value).subscribe({
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
  }

  myControl: FormControl = new FormControl();
  filteredOptions: Observable<string[]> | undefined;
  options = this.namePhones;
  
  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value: any) => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSubmitByName(): void {
    const { nameofPhone } = this.byName;

    this.search.SearchByName(nameofPhone).subscribe({
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