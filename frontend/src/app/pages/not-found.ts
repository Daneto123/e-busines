import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="empty card">
      <div class="icon">🤷</div>
      <h1>Няма такава страница</h1>
      <a routerLink="/" class="btn primary">Към каталога</a>
    </div>
  `,
})
export class NotFound {}
