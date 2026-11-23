import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { apiError, ProductService, ToastService } from '../core/api';
import { CaseImage } from '../shared/case-image';

const EMPTY = { phoneModel: '', heightMm: '', widthMm: '', thicknessMm: '', color: '', material: '', description: '', price: '', stock: '' };

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, RouterLink, CaseImage],
  template: `
    <a routerLink="/seller" class="back">← Към панела</a>
    <h1>{{ id() ? 'Редакция на калъф' : 'Нов калъф' }}</h1>

    <form class="card layout" (ngSubmit)="submit()" (input)="edited($event)" novalidate>
      <div class="picture">
        <app-case-image [src]="preview()" [color]="form.color" alt="Снимка на калъфа" />
        <label class="btn small">
          {{ preview() ? 'Смени снимката' : 'Качи снимка' }}
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="pick($event)" hidden />
        </label>
        @if (preview()) {
          <button type="button" class="btn ghost small" (click)="clearImage()">Премахни снимката</button>
        }
        <span class="muted small">JPG, PNG или WebP, до 3 MB</span>
        <span class="error">{{ errors()['image'] }}</span>
      </div>

      <div class="fields">
        <label class="field">Модел на телефона *
          <input name="phoneModel" [(ngModel)]="form.phoneModel" [class.invalid]="errors()['phoneModel']" placeholder="напр. iPhone 15" />
          <span class="error">{{ errors()['phoneModel'] }}</span>
        </label>
        <p class="muted hint">Размери на телефона, за който е калъфът (по тях клиентите търсят):</p>
        <div class="grid-3">
          @for (f of sizeFields; track f.key) {
            <label class="field">{{ f.label }} (мм) *
              <input [name]="f.key" [attr.name]="f.key" [(ngModel)]="form[f.key]" inputmode="decimal" [class.invalid]="errors()[f.key]" />
              <span class="error">{{ errors()[f.key] }}</span>
            </label>
          }
        </div>
        <div class="grid-2">
          <label class="field">Цвят *
            <input name="color" [(ngModel)]="form.color" [class.invalid]="errors()['color']" list="colors" />
            <span class="error">{{ errors()['color'] }}</span>
          </label>
          <label class="field">Материал
            <input name="material" [(ngModel)]="form.material" placeholder="силикон, кожа…" />
            <span class="error">{{ errors()['material'] }}</span>
          </label>
          <label class="field">Цена (€) *
            <input name="price" [(ngModel)]="form.price" inputmode="decimal" [class.invalid]="errors()['price']" />
            <span class="error">{{ errors()['price'] }}</span>
          </label>
          <label class="field">Наличност (бр.) *
            <input name="stock" [(ngModel)]="form.stock" inputmode="numeric" [class.invalid]="errors()['stock']" />
            <span class="error">{{ errors()['stock'] }}</span>
          </label>
        </div>
        <label class="field">Описание
          <textarea name="description" rows="3" [(ngModel)]="form.description"></textarea>
          <span class="error">{{ errors()['description'] }}</span>
        </label>
        <datalist id="colors">
          @for (c of colors; track c) { <option [value]="c"></option> }
        </datalist>
        @if (error()) { <p class="form-error">{{ error() }}</p> }
        <div class="buttons">
          <button type="submit" class="btn primary" [disabled]="busy()">{{ id() ? 'Запази' : 'Добави' }}</button>
          <a routerLink="/seller" class="btn">Отказ</a>
        </div>
      </div>
    </form>
  `,
  styles: `
    .back { display: inline-block; margin-bottom: 14px; text-decoration: none; }
    .layout { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
    .picture { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
    .fields { display: flex; flex-direction: column; gap: 14px; }
    .hint { margin: 0; font-size: 14px; }
    .small { font-size: 12px; }
    .buttons { display: flex; gap: 10px; }
    @media (max-width: 700px) { .layout { grid-template-columns: 1fr; } .picture { max-width: 240px; } }
  `,
})
export class ProductForm implements OnInit, OnDestroy {
  readonly id = input<string>();
  private products = inject(ProductService);
  private toast = inject(ToastService);
  private router = inject(Router);

  protected form: Record<keyof typeof EMPTY, string> = { ...EMPTY };
  protected readonly sizeFields = [
    { key: 'heightMm', label: 'Височина' },
    { key: 'widthMm', label: 'Ширина' },
    { key: 'thicknessMm', label: 'Дебелина' },
  ] as const;
  protected readonly colors = ['Черен', 'Бял', 'Прозрачен', 'Син', 'Червен', 'Зелен', 'Розов', 'Сив', 'Лилав', 'Бежов'];
  protected readonly preview = signal<string | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  private image: File | null = null;
  private removeImage = false;
  private objectUrl: string | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) return;
    try {
      const p = await this.products.get(Number(id));
      const text = (n: number) => String(n).replace('.', ',');
      this.form = {
        phoneModel: p.phoneModel, heightMm: text(p.heightMm), widthMm: text(p.widthMm), thicknessMm: text(p.thicknessMm),
        color: p.color, material: p.material, description: p.description, price: text(p.price), stock: String(p.stock),
      };
      this.preview.set(p.imageUrl);
    } catch (err) {
      this.error.set(apiError(err).error);
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }

  pick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      this.errors.update((e) => ({ ...e, image: 'Снимката е по-голяма от 3 MB.' }));
      return;
    }
    this.errors.update(({ image, ...rest }) => rest);
    this.setPreview(file);
  }

  clearImage(): void {
    this.setPreview(null);
    this.removeImage = true;
  }

  private setPreview(file: File | null): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = file ? URL.createObjectURL(file) : null;
    this.image = file;
    if (file) this.removeImage = false;
    this.preview.set(this.objectUrl);
  }

  /** The message under a field goes away once the field is changed. */
  edited(event: Event): void {
    const name = (event.target as HTMLInputElement).name;
    if (name && this.errors()[name]) this.errors.update(({ [name]: _, ...rest }) => rest);
  }

  async submit(): Promise<void> {
    this.busy.set(true);
    this.errors.set({});
    this.error.set('');
    try {
      const id = this.id() ? Number(this.id()) : null;
      await this.products.save(id, this.form, this.image, this.removeImage && !this.image);
      this.toast.show(id ? 'Промените са запазени.' : 'Калъфът е добавен.');
      this.router.navigateByUrl('/seller');
    } catch (err) {
      const e = apiError(err);
      if (e.fields) this.errors.set(e.fields);
      else this.error.set(e.error);
    } finally {
      this.busy.set(false);
    }
  }
}
