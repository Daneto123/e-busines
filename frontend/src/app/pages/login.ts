import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiError, AuthService, CartService, ToastService } from '../core/api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <form class="card auth" (ngSubmit)="submit()" novalidate>
      <h1>Вход</h1>
      <label class="field">Потребителско име или имейл
        <input name="username" [(ngModel)]="username" autocomplete="username" required />
      </label>
      <label class="field">Парола
        <input name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required />
      </label>
      @if (error()) { <p class="form-error">{{ error() }}</p> }
      <button type="submit" class="btn primary" [disabled]="busy()">Влез</button>
      <p class="muted">Нямате профил? <a routerLink="/register" [queryParams]="{ return: returnUrl }">Регистрирайте се</a></p>
    </form>
  `,
  styles: `
    .auth { max-width: 420px; margin: 20px auto; display: flex; flex-direction: column; gap: 14px; }
    .auth p { margin: 0; text-align: center; }
  `,
})
export class Login {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('return') || '/';

  protected username = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly busy = signal(false);

  async submit(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const user = await this.auth.login(this.username, this.password);
      await this.cart.load();
      this.toast.show(`Здравейте, ${user.username}!`);
      this.router.navigateByUrl(this.returnUrl.startsWith('/') ? this.returnUrl : '/');
    } catch (err) {
      this.error.set(apiError(err).error);
    } finally {
      this.busy.set(false);
    }
  }
}
