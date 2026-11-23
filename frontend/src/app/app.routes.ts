import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';

import { AuthService } from './core/api';

/** Waits until we know who is logged in (the first page load asks the server). */
async function currentUser() {
  const auth = inject(AuthService);
  if (!auth.loaded()) await auth.load();
  return auth.user();
}

const loggedIn: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  return (await currentUser()) ? true : router.createUrlTree(['/login'], { queryParams: { return: state.url } });
};

const seller: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const user = await currentUser();
  if (!user) return router.createUrlTree(['/login'], { queryParams: { return: state.url } });
  return user.role === 'seller' ? true : router.createUrlTree(['/']);
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/catalog').then((m) => m.Catalog), title: 'CaseShop — калъфи за телефони' },
  { path: 'product/:id', loadComponent: () => import('./pages/product').then((m) => m.ProductPage), title: 'Калъф — CaseShop' },
  { path: 'cart', loadComponent: () => import('./pages/cart').then((m) => m.CartPage), canActivate: [loggedIn], title: 'Кошница — CaseShop' },
  { path: 'orders', loadComponent: () => import('./pages/orders').then((m) => m.Orders), canActivate: [loggedIn], title: 'Поръчки — CaseShop' },
  { path: 'request', loadComponent: () => import('./pages/request').then((m) => m.RequestPage), title: 'Заявка за калъф — CaseShop' },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login), title: 'Вход — CaseShop' },
  { path: 'register', loadComponent: () => import('./pages/register').then((m) => m.Register), title: 'Регистрация — CaseShop' },
  { path: 'seller', loadComponent: () => import('./pages/seller').then((m) => m.Seller), canActivate: [seller], title: 'Продавач — CaseShop' },
  { path: 'seller/new', loadComponent: () => import('./pages/product-form').then((m) => m.ProductForm), canActivate: [seller], title: 'Нов калъф — CaseShop' },
  { path: 'seller/edit/:id', loadComponent: () => import('./pages/product-form').then((m) => m.ProductForm), canActivate: [seller], title: 'Редакция — CaseShop' },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound), title: 'Няма такава страница — CaseShop' },
];
