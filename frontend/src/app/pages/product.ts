import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { apiError, ProductService } from '../core/api';
import { Product } from '../core/models';
import { AddToCart } from '../shared/add-to-cart';
import { CaseImage } from '../shared/case-image';
import { EuroPipe, SizePipe } from '../shared/format';

@Component({
  selector: 'app-product',
  imports: [RouterLink, CaseImage, EuroPipe, SizePipe],
  template: `
    <a routerLink="/" class="back">← Към каталога</a>
    @if (product(); as p) {
      <article class="card layout">
        <app-case-image [src]="p.imageUrl" [color]="p.color" [alt]="'Калъф за ' + p.phoneModel" />
        <div class="info">
          <h1>Калъф за {{ p.phoneModel }}</h1>
          <div class="price">{{ p.price | eur }}</div>
          <dl>
            <dt>Цвят</dt><dd>{{ p.color }}</dd>
            @if (p.material) { <dt>Материал</dt><dd>{{ p.material }}</dd> }
            <dt>За телефон с размери</dt><dd>{{ p | size }} <span class="muted">(В × Ш × Д)</span></dd>
            <dt>Продавач</dt><dd>{{ p.seller.companyName }}</dd>
            <dt>Наличност</dt>
            <dd [class]="p.stock === 0 ? 'stock-none' : p.stock < 5 ? 'stock-low' : 'stock-ok'">
              {{ p.stock === 0 ? 'изчерпан' : p.stock < 5 ? 'последни ' + p.stock + ' бр.' : 'в наличност' }}
            </dd>
          </dl>
          @if (p.description) { <p>{{ p.description }}</p> }
          @if (p.stock > 0) {
            <div class="buy">
              <div class="qty">
                <button type="button" class="btn small" (click)="quantity.set(quantity() - 1)" [disabled]="quantity() <= 1" aria-label="По-малко">−</button>
                <span>{{ quantity() }}</span>
                <button type="button" class="btn small" (click)="quantity.set(quantity() + 1)" [disabled]="quantity() >= p.stock" aria-label="Повече">+</button>
              </div>
              <button type="button" class="btn primary" (click)="cart.add(p, quantity())">Добави в кошницата</button>
            </div>
          } @else {
            <p class="muted">Няма наличност. <a routerLink="/request" [queryParams]="{ model: p.phoneModel }">Изпратете заявка</a> и продавачите ще ви пишат.</p>
          }
        </div>
      </article>
    } @else if (error()) {
      <div class="empty card"><div class="icon">📦</div><p>{{ error() }}</p></div>
    }
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 14px; text-decoration: none; }
    .layout { display: grid; grid-template-columns: minmax(240px, 380px) 1fr; gap: 28px; }
    h1 { margin-bottom: 6px; }
    .price { font-size: 28px; font-weight: 800; margin-bottom: 14px; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0 0 14px; }
    dt { color: var(--muted); }
    dd { margin: 0; }
    .buy { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 18px; }
    .qty { display: flex; align-items: center; gap: 10px; }
    .qty span { min-width: 24px; text-align: center; font-weight: 700; }
    @media (max-width: 700px) { .layout { grid-template-columns: 1fr; } }
  `,
})
export class ProductPage {
  readonly id = input.required<string>();
  protected readonly product = signal<Product | null>(null);
  protected readonly error = signal('');
  protected readonly quantity = signal(1);
  protected readonly cart = inject(AddToCart);
  private products = inject(ProductService);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.product.set(null);
      this.products
        .get(id)
        .then((p) => this.product.set(p))
        .catch((err) => this.error.set(apiError(err).error));
    });
  }
}
