import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiError, AuthService, CartService, ToastService } from '../core/api';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <form class="card auth" (ngSubmit)="submit()" (input)="edited($event)" novalidate>
      <h1>Регистрация</h1>

      <div class="roles" role="radiogroup" aria-label="Тип профил">
        <label [class.active]="form.role === 'buyer'">
          <input type="radio" name="role" value="buyer" [(ngModel)]="form.role" />
          <strong>Купувач</strong><span>Пазарувам калъфи</span>
        </label>
        <label [class.active]="form.role === 'seller'">
          <input type="radio" name="role" value="seller" [(ngModel)]="form.role" />
          <strong>Продавач</strong><span>Фирма, която продава калъфи</span>
        </label>
      </div>
      <span class="error">{{ errors()['role'] }}</span>

      @if (form.role === 'seller') {
        <label class="field">Име на фирмата *
          <input name="companyName" [(ngModel)]="form.companyName" [class.invalid]="errors()['companyName']" autocomplete="organization" />
          <span class="error">{{ errors()['companyName'] }}</span>
        </label>
      }
      <label class="field">Потребителско име *
        <input name="username" [(ngModel)]="form.username" [class.invalid]="errors()['username']" autocomplete="username" />
        <span class="error">{{ errors()['username'] }}</span>
      </label>
      <label class="field">Имейл *
        <input name="email" type="email" [(ngModel)]="form.email" [class.invalid]="errors()['email']" autocomplete="email" />
        <span class="error">{{ errors()['email'] }}</span>
      </label>
      <div class="grid-2">
        <label class="field">Парола * <small>(поне 8 знака)</small>
          <input name="password" type="password" [(ngModel)]="form.password" [class.invalid]="errors()['password']" autocomplete="new-password" />
          <span class="error">{{ errors()['password'] }}</span>
        </label>
        <label class="field">Повторете паролата *
          <input name="repeat" type="password" [(ngModel)]="repeat" [class.invalid]="errors()['repeat']" autocomplete="new-password" />
          <span class="error">{{ errors()['repeat'] }}</span>
        </label>
      </div>
      @if (error()) { <p class="form-error">{{ error() }}</p> }
      <button type="submit" class="btn primary" [disabled]="busy()">Създай профил</button>
      <p class="muted">Имате профил? <a routerLink="/login" [queryParams]="{ return: returnUrl }">Влезте</a></p>
    </form>
  `,
  styles: `
    .auth { max-width: 520px; margin: 20px auto; display: flex; flex-direction: column; gap: 14px; }
    .auth p { margin: 0; text-align: center; }
    .roles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .roles label { display: flex; flex-direction: column; gap: 2px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; cursor: pointer; }
    .roles label.active { border-color: var(--accent); background: var(--accent-soft); }
    .roles input { position: absolute; opacity: 0; }
    .roles span { font-size: 13px; color: var(--muted); }
  `,
})
export class Register {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('return') || '/';

  protected form = { role: 'buyer', companyName: '', username: '', email: '', password: '' };
  protected repeat = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  /** The message under a field goes away once the field is changed. */
  edited(event: Event): void {
    const name = (event.target as HTMLInputElement).name;
    if (name && this.errors()[name]) this.errors.update(({ [name]: _, ...rest }) => rest);
  }

  async submit(): Promise<void> {
    this.errors.set({});
    this.error.set('');
    if (this.form.password !== this.repeat) {
      this.errors.set({ repeat: 'Паролите не съвпадат.' });
      return;
    }
    this.busy.set(true);
    try {
      const user = await this.auth.register(this.form);
      await this.cart.load();
      this.toast.show(`Добре дошли, ${user.username}!`);
      const target = user.role === 'seller' ? '/seller' : this.returnUrl;
      this.router.navigateByUrl(target.startsWith('/') ? target : '/');
    } catch (err) {
      const e = apiError(err);
      if (e.fields) this.errors.set(e.fields);
      else this.error.set(e.error);
    } finally {
      this.busy.set(false);
    }
  }
}
