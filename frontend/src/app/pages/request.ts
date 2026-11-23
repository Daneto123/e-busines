import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { apiError, AuthService, ShopService } from '../core/api';

@Component({
  selector: 'app-request',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="narrow">
      <h1>Заявка за калъф</h1>
      <p class="muted">Не намерихте калъф? Опишете телефона и заявката отива до всички продавачи. Те ще ви пишат на имейла.</p>

      @if (sent()) {
        <div class="card done">
          <div class="icon">📨</div>
          <p>{{ sent() }}</p>
          <a routerLink="/" class="btn">Към каталога</a>
        </div>
      } @else {
        <form class="card" (ngSubmit)="submit()" (input)="edited($event)" novalidate>
          <label class="field">Модел на телефона *
            <input name="phoneModel" [(ngModel)]="form.phoneModel" [class.invalid]="errors()['phoneModel']" placeholder="напр. Nokia 3310" />
            <span class="error">{{ errors()['phoneModel'] }}</span>
          </label>
          <p class="muted hint">Размери на телефона (ако не знаете модела точно):</p>
          <div class="grid-3">
            <label class="field">Височина (мм)<input name="heightMm" [(ngModel)]="form.heightMm" inputmode="decimal" [class.invalid]="errors()['heightMm']" /><span class="error">{{ errors()['heightMm'] }}</span></label>
            <label class="field">Ширина (мм)<input name="widthMm" [(ngModel)]="form.widthMm" inputmode="decimal" [class.invalid]="errors()['widthMm']" /><span class="error">{{ errors()['widthMm'] }}</span></label>
            <label class="field">Дебелина (мм)<input name="thicknessMm" [(ngModel)]="form.thicknessMm" inputmode="decimal" [class.invalid]="errors()['thicknessMm']" /><span class="error">{{ errors()['thicknessMm'] }}</span></label>
          </div>
          <div class="grid-2">
            <label class="field">Желан цвят<input name="color" [(ngModel)]="form.color" placeholder="без значение" /></label>
            <label class="field">Имейл за отговор *
              <input name="email" type="email" [(ngModel)]="form.email" [class.invalid]="errors()['email']" />
              <span class="error">{{ errors()['email'] }}</span>
            </label>
          </div>
          <label class="field">Подробности<textarea name="details" rows="3" [(ngModel)]="form.details" placeholder="материал, цена, срок…"></textarea></label>
          @if (error()) { <p class="form-error">{{ error() }}</p> }
          <button type="submit" class="btn primary" [disabled]="busy()">Изпрати заявката</button>
        </form>
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 640px; margin: 0 auto; }
    form { display: flex; flex-direction: column; gap: 14px; }
    .hint { margin: 0; font-size: 14px; }
    .done { text-align: center; }
    .done .icon { font-size: 44px; }
  `,
})
export class RequestPage implements OnInit {
  private shop = inject(ShopService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  protected form = { phoneModel: '', heightMm: '', widthMm: '', thicknessMm: '', color: '', email: '', details: '' };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly sent = signal('');

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.form.phoneModel = qp.get('model') ?? '';
    this.form.heightMm = qp.get('height') ?? '';
    this.form.widthMm = qp.get('width') ?? '';
    this.form.thicknessMm = qp.get('thickness') ?? '';
    this.form.email = this.auth.user()?.email ?? '';
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
      this.sent.set((await this.shop.sendRequest(this.form)).message);
    } catch (err) {
      const e = apiError(err);
      if (e.fields) this.errors.set(e.fields);
      else this.error.set(e.error);
    } finally {
      this.busy.set(false);
    }
  }
}
