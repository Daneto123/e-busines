import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../core/models';
import { AddToCart } from './add-to-cart';
import { CaseImage } from './case-image';
import { EuroPipe, SizePipe } from './format';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, CaseImage, EuroPipe, SizePipe],
  template: `
    @let p = product();
    <a [routerLink]="['/product', p.id]" class="image-link">
      <app-case-image [src]="p.imageUrl" [color]="p.color" [alt]="'Калъф за ' + p.phoneModel" />
    </a>
    <div class="body">
      <a [routerLink]="['/product', p.id]" class="title">{{ p.phoneModel }}</a>
      <div class="meta">{{ p.color }}@if (p.material) { · {{ p.material }} }</div>
      <div class="meta size">{{ p | size }}</div>
      @if (p.sizeDifferenceMm !== undefined) {
        <div class="fit" [class.exact]="p.sizeDifferenceMm <= 0.5">
          {{ p.sizeDifferenceMm <= 0.5 ? '✓ Точно за този размер' : 'Разлика до ' + comma(p.sizeDifferenceMm) + ' мм' }}
        </div>
      }
      <div class="bottom">
        <span class="price">{{ p.price | eur }}</span>
        @if (p.stock > 0) {
          <button type="button" class="btn primary small" (click)="cart.add(p)">Купи</button>
        } @else {
          <span class="stock-none">Изчерпан</span>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; background: var(--panel); border: 1px solid var(--line);
            border-radius: var(--radius); overflow: hidden; transition: box-shadow .15s, transform .15s; }
    :host:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .image-link app-case-image { border-radius: 0; }
    .body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 3px; flex: 1; }
    .title { font-weight: 700; color: var(--text); text-decoration: none; }
    .title:hover { color: var(--accent); }
    .meta { color: var(--muted); font-size: 13px; }
    .size { font-variant-numeric: tabular-nums; }
    .fit { font-size: 13px; color: #b45309; }
    .fit.exact { color: var(--ok); font-weight: 600; }
    .bottom { margin-top: auto; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; }
    .price { font-size: 18px; font-weight: 800; }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  protected readonly cart = inject(AddToCart);
  protected comma(n: number): string {
    return String(n).replace('.', ',');
  }
}
