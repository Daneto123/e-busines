import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { apiError, AuthService, ProductService, ShopService, ToastService } from '../core/api';
import { CaseRequest, Product } from '../core/models';
import { CaseImage } from '../shared/case-image';
import { EuroPipe, SizePipe, WhenPipe } from '../shared/format';

@Component({
  selector: 'app-seller',
  imports: [RouterLink, CaseImage, EuroPipe, SizePipe, WhenPipe],
  template: `
    <div class="head">
      <h1>{{ auth.user()?.companyName }}</h1>
      <a routerLink="/seller/new" class="btn primary">+ Нов калъф</a>
    </div>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" [class.active]="tab() === 'products'" (click)="tab.set('products')">Моите калъфи ({{ products().length }})</button>
      <button type="button" role="tab" [class.active]="tab() === 'requests'" (click)="tab.set('requests')">Заявки от клиенти ({{ requests().length }})</button>
    </div>

    @if (error()) { <p class="form-error">{{ error() }}</p> }

    @if (tab() === 'products') {
      <div class="card table-wrap">
        <table>
          <thead><tr><th></th><th>Модел</th><th>Размери</th><th>Цвят</th><th class="num">Цена</th><th class="num">Наличност</th><th></th></tr></thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td><app-case-image [src]="p.imageUrl" [color]="p.color" [alt]="p.phoneModel" /></td>
                <td><a [routerLink]="['/product', p.id]">{{ p.phoneModel }}</a></td>
                <td class="muted">{{ p | size }}</td>
                <td>{{ p.color }}</td>
                <td class="num">{{ p.price | eur }}</td>
                <td class="num" [class.stock-none]="p.stock === 0">{{ p.stock }}</td>
                <td>
                  <div class="actions">
                    <a [routerLink]="['/seller/edit', p.id]" class="btn small">Редакция</a>
                    <button type="button" class="btn small danger" (click)="remove(p)">Изтрий</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty">Още нямате калъфи. <a routerLink="/seller/new">Добавете първия.</a></td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      @for (r of requests(); track r.id) {
        <article class="card request">
          <header><strong>{{ r.phoneModel }}</strong><span class="muted">{{ r.createdAt | when }}</span></header>
          <div class="muted">
            @if (r.heightMm || r.widthMm || r.thicknessMm) { {{ r | size }} · }
            @if (r.color) { цвят: {{ r.color }} · }
            <a [href]="'mailto:' + r.email + '?subject=' + encode('Калъф за ' + r.phoneModel)">{{ r.email }}</a>
          </div>
          @if (r.details) { <p>{{ r.details }}</p> }
        </article>
      } @empty {
        <div class="empty card">Няма заявки.</div>
      }
    }
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .tabs { display: flex; gap: 6px; margin-bottom: 14px; }
    .tabs button { border: 1px solid var(--line); background: var(--panel); color: var(--text); padding: 8px 14px; border-radius: 10px; font: inherit; cursor: pointer; }
    .tabs button.active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); font-weight: 600; }
    .table-wrap { padding: 0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; }
    th { font-size: 13px; color: var(--muted); font-weight: 600; }
    tr:last-child td { border-bottom: 0; }
    td app-case-image { width: 44px; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .actions { display: flex; gap: 6px; justify-content: flex-end; }
    .request { margin-bottom: 12px; }
    .request header { display: flex; gap: 12px; align-items: baseline; }
    .request p { margin: 8px 0 0; }
  `,
})
export class Seller implements OnInit {
  protected readonly auth = inject(AuthService);
  private productService = inject(ProductService);
  private shop = inject(ShopService);
  private toast = inject(ToastService);

  protected readonly tab = signal<'products' | 'requests'>('products');
  protected readonly products = signal<Product[]>([]);
  protected readonly requests = signal<CaseRequest[]>([]);
  protected readonly error = signal('');
  protected readonly encode = encodeURIComponent;

  async ngOnInit(): Promise<void> {
    try {
      const [products, requests] = await Promise.all([this.productService.mine(), this.shop.requests()]);
      this.products.set(products);
      this.requests.set(requests);
    } catch (err) {
      this.error.set(apiError(err).error);
    }
  }

  async remove(p: Product): Promise<void> {
    if (!confirm(`Да изтрия ли калъфа за ${p.phoneModel} (${p.color})?`)) return;
    try {
      await this.productService.remove(p.id);
      this.products.update((list) => list.filter((x) => x.id !== p.id));
      this.toast.show('Калъфът е изтрит.');
    } catch (err) {
      this.toast.show(apiError(err).error, 'error');
    }
  }
}
