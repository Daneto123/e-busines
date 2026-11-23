import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiError, ProductService } from '../core/api';
import { Filters, Product, ProductSearch } from '../core/models';
import { ProductCard } from '../shared/product-card';

type Mode = 'model' | 'size';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterLink, ProductCard],
  template: `
    <section class="hero">
      <h1>Калъф за всеки телефон</h1>
      <p>Търсете по модел, или по размерите на телефона, ако не знаете модела или е по-стар.</p>

      <div class="modes" role="tablist">
        <button type="button" role="tab" [class.active]="mode() === 'model'" (click)="setMode('model')">По модел</button>
        <button type="button" role="tab" [class.active]="mode() === 'size'" (click)="setMode('size')">По размери</button>
      </div>

      <form class="search" (ngSubmit)="search()">
        @if (mode() === 'model') {
          <input name="q" [(ngModel)]="q" placeholder="напр. iPhone 15, Galaxy S24, Lumia…" aria-label="Модел на телефона"
                 (input)="searchSoon()" autocomplete="off" />
        } @else {
          <div class="sizes">
            <label>Височина (мм)<input name="height" [(ngModel)]="height" inputmode="decimal" placeholder="146,7" /></label>
            <label>Ширина (мм)<input name="width" [(ngModel)]="width" inputmode="decimal" placeholder="71,5" /></label>
            <label>Дебелина (мм)<input name="thickness" [(ngModel)]="thickness" inputmode="decimal" placeholder="7,4" /></label>
            <label>Допуск ±
              <select name="tolerance" [(ngModel)]="tolerance">
                <option [ngValue]="0.5">0,5 мм</option>
                <option [ngValue]="1.5">1,5 мм</option>
                <option [ngValue]="3">3 мм</option>
                <option [ngValue]="5">5 мм</option>
              </select>
            </label>
          </div>
        }
        <button type="submit" class="btn primary">Търси</button>
      </form>
    </section>

    <section class="filters">
      <select [(ngModel)]="color" (ngModelChange)="search()" aria-label="Цвят">
        <option value="">Всички цветове</option>
        @for (c of filters()?.colors; track c) {
          <option [value]="c">{{ c }}</option>
        }
      </select>
      <select [(ngModel)]="maxPrice" (ngModelChange)="search()" aria-label="Цена">
        <option [ngValue]="null">Всякаква цена</option>
        <option [ngValue]="10">до 10 €</option>
        <option [ngValue]="15">до 15 €</option>
        <option [ngValue]="20">до 20 €</option>
      </select>
      <select [(ngModel)]="sort" (ngModelChange)="search()" aria-label="Подреждане">
        <option value="">{{ mode() === 'size' ? 'Най-точни първо' : 'Най-нови първо' }}</option>
        <option value="price">Цена: ниска → висока</option>
        <option value="-price">Цена: висока → ниска</option>
      </select>
      <label class="check"><input type="checkbox" [(ngModel)]="inStock" (ngModelChange)="search()" /> Само в наличност</label>
      <span class="count muted">{{ loading() ? 'Търсене…' : products().length + ' калъфа' }}</span>
    </section>

    @if (error()) {
      <p class="form-error">{{ error() }}</p>
    }

    <section class="grid">
      @for (p of products(); track p.id) {
        <app-product-card [product]="p" />
      }
    </section>

    @if (!loading() && !products().length && !error()) {
      <div class="empty card">
        <div class="icon">🔍</div>
        <p>Не намерихме калъф за това търсене.</p>
        <a class="btn primary" routerLink="/request" [queryParams]="requestParams()">Изпратете заявка до продавачите</a>
      </div>
    }
  `,
  styles: `
    .hero { background: linear-gradient(135deg, var(--accent), #7c3aed); color: #fff; border-radius: 20px; padding: 28px; margin-bottom: 18px; }
    .hero h1 { font-size: 30px; margin: 0 0 4px; }
    .hero p { margin: 0 0 16px; opacity: .9; }
    .modes { display: inline-flex; background: rgb(255 255 255 / 15%); border-radius: 11px; padding: 3px; margin-bottom: 12px; }
    .modes button { border: 0; background: transparent; color: #fff; padding: 7px 16px; border-radius: 9px; font: inherit; cursor: pointer; }
    .modes button.active { background: #fff; color: var(--accent); font-weight: 600; }
    .search { display: flex; gap: 10px; align-items: flex-end; }
    .search > input { flex: 1; font-size: 17px; padding: 12px 14px; border: 0; }
    .search .btn { padding: 12px 22px; background: #0f172a; border-color: #0f172a; }
    .sizes { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .sizes label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; opacity: .95; }
    .sizes input, .sizes select { border: 0; }
    .filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 16px; }
    .filters select { width: auto; }
    .check { display: flex; gap: 6px; align-items: center; }
    .count { margin-left: auto; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
    @media (max-width: 640px) {
      .hero { padding: 20px; }
      .hero h1 { font-size: 24px; }
      .search { flex-direction: column; align-items: stretch; }
      .sizes { grid-template-columns: 1fr 1fr; }
      .count { margin-left: 0; }
      .grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .filters select { flex: 1 1 40%; }
    }
  `,
})
export class Catalog implements OnInit {
  private products$ = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly mode = signal<Mode>('model');
  protected readonly products = signal<Product[]>([]);
  protected readonly filters = signal<Filters | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected q = '';
  protected height = '';
  protected width = '';
  protected thickness = '';
  protected tolerance = 1.5;
  protected color = '';
  protected maxPrice: number | null = null;
  protected sort = '';
  protected inStock = false;

  private timer?: ReturnType<typeof setTimeout>;
  private requestId = 0;

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.q = qp.get('q') ?? '';
    if (qp.get('height')) {
      this.mode.set('size');
      this.height = qp.get('height') ?? '';
      this.width = qp.get('width') ?? '';
      this.thickness = qp.get('thickness') ?? '';
    }
    this.products$.filters().then((f) => this.filters.set(f)).catch(() => {});
    this.search();
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.sort = '';
    this.search();
  }

  searchSoon(): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.search(), 250);
  }

  private criteria(): ProductSearch {
    const n = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);
    const bySize = this.mode() === 'size';
    return {
      q: bySize ? '' : this.q.trim(),
      height: bySize ? n(this.height) : null,
      width: bySize ? n(this.width) : null,
      thickness: bySize ? n(this.thickness) : null,
      tolerance: bySize ? this.tolerance : null,
      color: this.color,
      maxPrice: this.maxPrice,
      inStock: this.inStock,
      sort: this.sort,
    };
  }

  async search(): Promise<void> {
    clearTimeout(this.timer);
    const id = ++this.requestId; // only the newest answer is shown
    const c = this.criteria();
    this.loading.set(true);
    this.error.set('');
    this.router.navigate([], {
      queryParams: { q: c.q || null, height: c.height, width: c.width, thickness: c.thickness },
      replaceUrl: true,
    });
    try {
      const result = await this.products$.search(c);
      if (id === this.requestId) this.products.set(result);
    } catch (err) {
      if (id === this.requestId) this.error.set(apiError(err).error);
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }

  protected requestParams(): Record<string, string> {
    const c = this.criteria();
    return Object.fromEntries(
      Object.entries({ model: c.q, height: c.height, width: c.width, thickness: c.thickness }).filter(([, v]) => v),
    ) as Record<string, string>;
  }
}
