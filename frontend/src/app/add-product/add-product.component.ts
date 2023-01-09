import { Component, OnInit } from '@angular/core';
import { AddProductService } from './add-product.service';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {

  form: any = {
    CompanyName: null,
    PhoneModel: null,
    Width: null,
    Height: null,
    Thickness: null,
    Color: null,
    Availability: null,
    Price: null
  };

  isSend = false;
  errorMessage = '';
  isImageSuccess = false;
  errorTypeMessage = '';

  constructor(private addProduct: AddProductService) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    const { CompanyName, PhoneModel, Height, Width, Thickness, Color, Availability, Price } = this.form;

    this.addProduct.AddProduct(CompanyName, PhoneModel, Width, Height, Thickness, Color, Availability, Price).subscribe({
      next: data => {
        console.log(data);
        this.isSend = true;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }

  uploadImage(fileEvent: any) {
    const file = fileEvent.targer.files[0];
    if(file.size != '.jpg') {
      this.isImageSuccess = true;
      this.errorTypeMessage = "Can upload only jpg pictures";
    }
  }

}
