import { Component, OnInit } from '@angular/core';
import { ContactService } from './contact.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})

export class ContactComponent implements OnInit {

  form: any = {
    phoneModule: null,
    width: null,
    height: null,
    thickness: null,
    color: null,
    email: null,
    moreInfo: null
  };

  isSubmitted = false;
  errorMessage = '';

  constructor(private contactService: ContactService) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    const { phoneModule, width, height, thickness, color, email, moreInfo } = this.form;

    this.contactService.Request(phoneModule, width, height, thickness, color, email, moreInfo).subscribe({
      next: data => {
        console.log(data);
        this.isSubmitted = true;
      },
      error: err => {
        this.errorMessage = err.error.message;
      }
    });
  }



}
