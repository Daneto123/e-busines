import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { apiError, CartService, ToastService } from '../core/api';
import { CartItem, Order } from '../core/models';
import { CaseImage } from '../shared/case-image';
import { EuroPipe } from '../shared/format';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CaseImage, EuroPipe],
  template: `
    <h1>Кошница</h1>

    @if (order(); as o) {
      <div class="card done">
        <div class="icon">✅</div>
        <h2>Поръчка № {{ o.id }} е приета</h2>
        <p>Общо {{ o.total | eur }}. Можете да я видите в <a routerLink="/orders">Поръчки</a>.</p>
        <a routerLink="/" class="btn">Обратно към каталога</a>
      </div>
    } @else if (cart.cart().items.length) {
      <div class="layout">
        <ul class="items card">
          @for (item of cart.cart().items; track item.productId) {
            <li>
              <app-case-image [src]="item.imageUrl" [color]="item.color" [alt]="item.phoneModel" />
              <div class="name">
                <a [routerLink]="['/product', item.productId]">{{ item.phoneModel }}</a>
                <span class="muted">{{ item.color }} · {{ item.price | eur }}</span>
                @if (item.problem) { <span class="error">{{ item.problem }}</span> }
              </div>
              <div class="qty">
                <button type="button" class="btn small" (click)="change(item, item.quantity - 1)" aria-label="По-малко">−</button>
                <span>{{ item.quantity }}</span>
                <button type="button" class="btn small" (click)="change(item, item.quantity + 1)" [disabled]="item.quantity >= item.stock" aria-label="Повече">+</button>
              </div>
              <strong class="line">{{ item.lineTotal | eur }}</strong>
              <button type="button" class="btn ghost small" (click)="change(item, 0)" aria-label="Премахни">✕</button>
            </li>
          }
        </ul>
        <aside class="card summary">
          <div class="row"><span>Артикули</span><span>{{ cart.cart().count }}</span></div>
          <div class="row total"><span>Общо</span><span>{{ cart.cart().total | eur }}</span></div>
          @if (error()) { <p class="form-error">{{ error() }}</p> }
          <button type="button" class="btn primary" (click)="checkout()" [disabled]="busy()">Плати</button>
          <p class="muted small">Учебен проект: плащането е симулирано, поръчката се записва и наличността намалява.</p>
        </aside>
      </div>
    } @else {
      <div class="empty card">
        <div class="icon">🛒</div>
        <p>Кошницата е празна.</p>
        <a routerLink="/" class="btn primary">Към каталога</a>
      </div>
    }
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 1fr 300px; gap: 18px; align-items: start; }
    .items { list-style: none; margin: 0; padding: 6px 16px; }
    .items li { display: grid; grid-template-columns: 64px 1fr auto 90px auto; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); }
    .items li:last-child { border-bottom: 0; }
    .name { display: flex; flex-direction: column; }
    .name a { font-weight: 700; color: var(--text); text-decoration: none; }
    .qty { display: flex; align-items: center; gap: 8px; }
    .qty span { min-width: 20px; text-align: center; }
    .line { text-align: right; }
    .summary { display: flex; flex-direction: column; gap: 10px; position: sticky; top: 80px; }
    .row { display: flex; justify-content: space-between; }
    .total { font-size: 20px; font-weight: 800; border-top: 1px solid var(--line); padding-top: 10px; }
    .small { font-size: 12px; margin: 0; }
    .done { text-align: center; }
    .done .icon { font-size: 44px; }
    @media (max-width: 800px) {
      .layout { grid-template-columns: 1fr; }
      .items li { grid-template-columns: 52px 1fr auto; }
      .line { grid-column: 2; text-align: left; }
    }
  `,
})
export class CartPage implements OnInit {
  protected readonly cart = inject(CartService);
  private toast = inject(ToastService);
  protected readonly order = signal<Order | null>(null);
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  ngOnInit(): void {
    this.cart.load();
  }

  async change(item: CartItem, quantity: number): Promise<void> {
    try {
      await this.cart.setQuantity(item.productId, Math.max(0, quantity));
    } catch (err) {
      this.toast.show(apiError(err).error, 'error');
    }
  }

  async checkout(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      this.order.set(await this.cart.checkout());
    } catch (err) {
      this.error.set(apiError(err).error);
      await this.cart.load(); // show the current stock
    } finally {
      this.busy.set(false);
    }
  }
}
