import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService, CartService, ToastService } from './core/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand" aria-label="Начало">
        <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="4" width="36" height="56" rx="9" fill="currentColor"/><rect x="19" y="10" width="11" height="11" rx="4" fill="#fff" opacity=".85"/></svg>
        CaseShop
      </a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Каталог</a>
        <a routerLink="/request" routerLinkActive="active">Заявка за калъф</a>
        @if (auth.isSeller()) {
          <a routerLink="/seller" routerLinkActive="active">Продавач</a>
        }
        @if (auth.user()) {
          <a routerLink="/orders" routerLinkActive="active">Поръчки</a>
        }
      </nav>
      <div class="right">
        <a routerLink="/cart" class="cart-link" routerLinkActive="active" aria-label="Кошница">
          🛒 <span class="hide-sm">Кошница</span>
          @if (cart.cart().count) {
            <span class="badge">{{ cart.cart().count }}</span>
          }
        </a>
        @if (auth.user(); as user) {
          <span class="user hide-sm" [title]="user.email">{{ user.companyName || user.username }}</span>
          <button type="button" class="btn ghost small" (click)="logout()">Изход</button>
        } @else if (auth.loaded()) {
          <a routerLink="/login" class="btn small">Вход</a>
          <a routerLink="/register" class="btn primary small hide-sm">Регистрация</a>
        }
      </div>
    </header>

    <main><router-outlet /></main>

    <footer>CaseShop · проект по „Системи за е-бизнес“ · Йордан Павлов</footer>

    @if (toast.message(); as t) {
      <div class="toast" [class.error]="t.kind === 'error'" role="status">{{ t.text }}</div>
    }
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .topbar { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 22px; padding: 10px 24px;
              background: var(--panel); border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 19px; color: var(--text); text-decoration: none; }
    .brand svg { width: 26px; height: 26px; color: var(--accent); }
    nav { display: flex; gap: 4px; }
    nav a, .cart-link { padding: 7px 11px; border-radius: 9px; color: var(--muted); text-decoration: none; font-weight: 500; }
    nav a:hover, .cart-link:hover { background: var(--soft); color: var(--text); }
    nav a.active, .cart-link.active { color: var(--accent); background: var(--accent-soft); }
    .right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
    .cart-link { position: relative; color: var(--text); }
    .badge { background: var(--accent); color: #fff; border-radius: 999px; font-size: 12px; padding: 1px 7px; margin-left: 4px; }
    .user { font-weight: 600; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    main { flex: 1; width: 100%; max-width: 1180px; margin: 0 auto; padding: 24px; }
    footer { text-align: center; color: var(--muted); font-size: 13px; padding: 18px; }
    .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: #0f172a; color: #fff;
             padding: 11px 18px; border-radius: 10px; box-shadow: 0 10px 30px rgb(0 0 0 / 25%); z-index: 20; max-width: calc(100vw - 32px); }
    .toast.error { background: var(--danger); }
    @media (max-width: 760px) {
      .topbar { flex-wrap: wrap; gap: 6px 10px; padding: 8px 12px; }
      nav { order: 3; width: 100%; overflow-x: auto; }
      .hide-sm { display: none; }
      main { padding: 14px; }
    }
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  constructor() {
    this.auth.load().then(() => {
      if (this.auth.user()) this.cart.load();
    });
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.cart.clearLocal();
    this.toast.show('Излязохте от профила.');
    this.router.navigateByUrl('/');
  }
}
