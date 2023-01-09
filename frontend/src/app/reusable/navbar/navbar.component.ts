import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  lenght: string = '';
  username: any = '';
  type: any;
  isOnSearch = false;
  isOnAddProduct = false;
  isAdd = false;
  isOnContact = false;
  isOnShopping = false;
  isOnLogin = true;
  isSlider = true;

  addItem(value: User){
    if(value != null){
      this.username = value.name;
      console.log(value);
      if(value.type == 1){
        this.isAdd = true;
      }
      if(value.isLogin == true){
        this.isOnLogin = false;
      }
      this.isOnSearch = true;
    }

  }

  showCart(){
    const styleto = document.getElementById("shoppingcart") as HTMLInputElement;

    if(styleto.style['display'] == "none"){
      styleto.style['display'] = "block"; 
    } else {
      styleto.style['display'] = "none";
    }
  }
  
  constructor() { }

  ngOnInit(): void {
  }

}

interface User {
  name: any,
  type: any,
  isLogin: any
}