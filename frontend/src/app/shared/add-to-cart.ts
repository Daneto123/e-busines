import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { apiError, AuthService, CartService, ToastService } from '../core/api';
import { Product } from '../core/models';

/** "Add to cart" from any page: asks to log in first if needed. */
@Injectable({ providedIn: 'root' })
export class AddToCart {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);

  async add(product: Product, quantity = 1): Promise<void> {
    if (!this.auth.user()) {
      this.toast.show('Влезте в профила си, за да пазарувате.');
      this.router.navigate(['/login'], { queryParams: { return: this.router.url } });
      return;
    }
    try {
      await this.cart.setQuantity(product.id, this.cart.quantityOf(product.id) + quantity);
      this.toast.show(`${product.phoneModel} (${product.color.toLocaleLowerCase('bg')}) е в кошницата.`);
    } catch (err) {
      this.toast.show(apiError(err).error, 'error');
    }
  }
}
