import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css']
})
export class SliderComponent implements OnInit {

  slides: string[];
  i: number;
  waitList: number;

  constructor() {
    this.i = 0;
    this.slides = [
      '../../assets/images/1.jpg',
      '../../assets/images/2.jpg',
      '../../assets/images/3.jpg',
    ];
    this.waitList = 5000;
    this.setDelay(this.waitList);
  }

  ngOnInit(): void {
    this.i = 1;
  }

  getSlide() {
    return this.slides[this.i];
  }

  getPrev() {
    this.i == 0 ? (this.i = this.slides.length - 1) : this.i--;
  }

  setDelay(times: any) {
      setTimeout(() => {
          console.log("Waited For: " + 5000/1000 + " seconds");
          this.getNext();
          // Call the setDelay function again with the remaining times
          this.setDelay(times);
      }, 5000);
    
  }

  getNext() {
    this.i = this.i + 1===this.slides.length ? 0 : this.i + 1;
  }

}
