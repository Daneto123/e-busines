import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../register/auth.service';
import { StorageService } from './storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  user: any = {
    username: null,
    password: null,
    type: null
  };
  isLoggedIn = false;
  isSeller = false;
  isLoginFailed = false;
  errorMessage = '';

  isOnLogin = false;

  @Output() newItemEvent = new EventEmitter<User>();

  items = {} as User;

  constructor(private authService: AuthService, private storageService: StorageService) { }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
    }
  }

  onSubmit(): void {
    const { username, password } = this.user;

    this.authService.login(username, password).subscribe({
      next: data => {

        console.log("asfasdasdasd");
        if(data != null) {

          if(data.length != 0){
            //this.storageService.saveUser(data);
            this.user.username = data[0].username;
            this.user.password = data[0].password;
            this.user.type = data[0].type;

            console.log(this.user.username)
            this.isLoggedIn = true;

            if(this.user.type == 1) {
              this.isSeller = true;
            }
          } else {
            this.isLoginFailed = true;
            this.isLoggedIn = false;
          }


          this.items = {
            name: this.user.username,
            type: this.user.type,
            isLogin: this.isLoggedIn
          }
          console.log(this.items.name)
        }

        //this.reloadPage();
      },
      error: err => {
        this.errorMessage = err.error.message;
        this.isLoginFailed = true;
      }
    });
  }

  reloadPage(): void {
    window.location.reload();
  }

  addNewUser() {
    if(this.isLoginFailed != true){
      let timer = setTimeout(()=>{                           // <<<---using ()=> syntax
        console.log(this.items)
        this.newItemEvent.emit(this.items);
        clearTimeout(timer);
      }, 300);
    }
  
  }

}

interface User {
  name: any,
  type: any,
  isLogin: any
}
