import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { apiError, ShopService } from '../core/api';
import { Order } from '../core/models';
import { EuroPipe, WhenPipe } from '../shared/format';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, EuroPipe, WhenPipe],
  template: `
    <h1>Моите поръчки</h1>
    @if (error()) { <p class="form-error">{{ error() }}</p> }
    @for (o of orders(); track o.id) {
      <article class="card order">
        <header><strong>Поръчка № {{ o.id }}</strong><span class="muted">{{ o.createdAt | when }}</span><strong>{{ o.total | eur }}</strong></header>
        <ul>
          @for (i of o.items; track $index) {
            <li>
              @if (i.productId) { <a [routerLink]="['/product', i.productId]">{{ i.phoneModel }}</a> } @else { {{ i.phoneModel }} }
              <span class="muted">{{ i.color }} · {{ i.quantity }} × {{ i.price | eur }}</span>
            </li>
          }
        </ul>
      </article>
    } @empty {
      @if (loaded()) {
        <div class="empty card"><div class="icon">📦</div><p>Още нямате поръчки.</p><a routerLink="/" class="btn primary">Към каталога</a></div>
      }
    }
  `,
  styles: `
    .order { margin-bottom: 14px; }
    header { display: flex; gap: 14px; align-items: baseline; flex-wrap: wrap; }
    header strong:last-child { margin-left: auto; }
    ul { margin: 10px 0 0; padding-left: 18px; }
    li { display: flex; gap: 10px; flex-wrap: wrap; padding: 3px 0; }
  `,
})
export class Orders implements OnInit {
  private shop = inject(ShopService);
  protected readonly orders = signal<Order[]>([]);
  protected readonly loaded = signal(false);
  protected readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.orders.set(await this.shop.orders());
    } catch (err) {
      this.error.set(apiError(err).error);
    }
    this.loaded.set(true);
  }
}
