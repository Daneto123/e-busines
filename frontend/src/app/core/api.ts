import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiErrorBody, CaseRequest, Cart, Filters, Order, Product, ProductSearch, User } from './models';

/** Turns any failed request into a message (and field messages) for the page. */
export function apiError(err: unknown): ApiErrorBody {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return { error: 'Няма връзка със сървъра.' };
    const body = err.error as Partial<ApiErrorBody> | null;
    if (body?.error) return { error: body.error, fields: body.fields };
    return { error: `Грешка ${err.status}` };
  }
  return { error: 'Нещо се обърка. Опитайте отново.' };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly user = signal<User | null>(null);
  readonly loaded = signal(false);
  readonly isSeller = computed(() => this.user()?.role === 'seller');

  /** Asks the server who is logged in (the session is an HttpOnly cookie). */
  async load(): Promise<void> {
    try {
      this.user.set(await firstValueFrom(this.http.get<User | null>('/api/auth/me')));
    } catch {
      this.user.set(null);
    }
    this.loaded.set(true);
  }

  async login(username: string, password: string): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/login', { username, password }));
    this.user.set(user);
    return user;
  }

  async register(data: { username: string; email: string; password: string; role: string; companyName?: string }): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/register', data));
    this.user.set(user);
    return user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {}));
    this.user.set(null);
  }
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  search(s: ProductSearch): Promise<Product[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(s)) {
      if (value !== undefined && value !== null && value !== '' && value !== false) params = params.set(key, String(value));
    }
    return firstValueFrom(this.http.get<Product[]>('/api/products', { params }));
  }

  filters(): Promise<Filters> {
    return firstValueFrom(this.http.get<Filters>('/api/products/filters'));
  }

  get(id: number): Promise<Product> {
    return firstValueFrom(this.http.get<Product>(`/api/products/${id}`));
  }

  mine(): Promise<Product[]> {
    return firstValueFrom(this.http.get<Product[]>('/api/products/mine'));
  }

  /** Product fields plus an optional picture, sent as a form (multipart). */
  save(id: number | null, fields: Record<string, string>, image: File | null, removeImage = false): Promise<Product> {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    if (image) form.append('image', image);
    if (removeImage) form.append('removeImage', 'true');
    return firstValueFrom(
      id === null ? this.http.post<Product>('/api/products', form) : this.http.patch<Product>(`/api/products/${id}`, form),
    );
  }

  remove(id: number): Promise<unknown> {
    return firstValueFrom(this.http.delete(`/api/products/${id}`));
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  readonly cart = signal<Cart>({ items: [], count: 0, total: 0 });

  async load(): Promise<void> {
    try {
      this.cart.set(await firstValueFrom(this.http.get<Cart>('/api/cart')));
    } catch {
      this.cart.set({ items: [], count: 0, total: 0 });
    }
  }

  quantityOf(productId: number): number {
    return this.cart().items.find((i) => i.productId === productId)?.quantity ?? 0;
  }

  async setQuantity(productId: number, quantity: number): Promise<void> {
    this.cart.set(await firstValueFrom(this.http.put<Cart>(`/api/cart/${productId}`, { quantity })));
  }

  async checkout(): Promise<Order> {
    const order = await firstValueFrom(this.http.post<Order>('/api/orders', {}));
    this.cart.set({ items: [], count: 0, total: 0 });
    return order;
  }

  clearLocal(): void {
    this.cart.set({ items: [], count: 0, total: 0 });
  }
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);

  orders(): Promise<Order[]> {
    return firstValueFrom(this.http.get<Order[]>('/api/orders'));
  }

  sendRequest(data: Record<string, unknown>): Promise<{ message: string; emailed: number }> {
    return firstValueFrom(this.http.post<{ message: string; emailed: number }>('/api/requests', data));
  }

  requests(): Promise<CaseRequest[]> {
    return firstValueFrom(this.http.get<CaseRequest[]>('/api/requests'));
  }
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<{ text: string; kind: 'ok' | 'error' } | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(text: string, kind: 'ok' | 'error' = 'ok'): void {
    this.message.set({ text, kind });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.message.set(null), 3500);
  }
}
