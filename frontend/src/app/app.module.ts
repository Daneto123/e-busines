import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './reusable/navbar/navbar.component';
import { FooterComponent } from './reusable/footer/footer.component';
import { SearchComponent } from './search/search.component';
import { AddProductComponent } from './add-product/add-product.component';
import { ContactComponent } from './contact/contact.component';
import { ShoppingCartComponent } from './shopping-cart/shopping-cart.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { ProductComponent } from './product/product.component';
import { MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule } from '@angular/material';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SearchSizeComponent } from './search-size/search-size.component';
import { SliderComponent } from './slider/slider.component';

const routes: Routes = [
  {
    path: '/',
    component: SearchComponent
  },
  {
    path: '/phonesByName/:name',
    component: SearchComponent
  },
  {
    path: '/phonesBySize/:height/:width/:thickness',
    component: SearchComponent
  },
  {
    path: '/contact',
    component: ContactComponent
  },
  {
    path: '/addPhones',
    component: AddProductComponent
  },
  {
    path: '/addItemCart',
    component: ShoppingCartComponent
  },
]

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    SearchComponent,
    AddProductComponent,
    ContactComponent,
    ShoppingCartComponent,
    RegisterComponent,
    LoginComponent,
    ProductComponent,
    SearchSizeComponent,
    SliderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, 
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    BrowserAnimationsModule
  ],
  providers: [ProductComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
