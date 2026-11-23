import { Component, computed, input } from '@angular/core';

const COLORS: Record<string, string> = {
  черен: '#1f2937',
  бял: '#f8fafc',
  прозрачен: '#e0f2fe',
  син: '#2563eb',
  червен: '#dc2626',
  зелен: '#16a34a',
  жълт: '#eab308',
  бежов: '#d6c4a8',
  розов: '#ec4899',
  сив: '#9ca3af',
  лилав: '#7c3aed',
  оранжев: '#f97316',
  кафяв: '#92400e',
};

/** The product picture, or a drawn case in the product's colour when there is none. */
@Component({
  selector: 'app-case-image',
  template: `
    @if (src()) {
      <img [src]="src()" [alt]="alt()" loading="lazy" />
    } @else {
      <svg viewBox="0 0 100 140" role="img" [attr.aria-label]="alt()">
        <rect x="18" y="6" width="64" height="128" rx="14" [attr.fill]="fill()" stroke="#94a3b8" stroke-width="1.5"
              [attr.fill-opacity]="transparent() ? 0.55 : 1" />
        <rect x="26" y="14" width="22" height="22" rx="7" fill="#0f172a" opacity="0.85" />
        <circle cx="33" cy="21" r="3.5" fill="#334155" />
        <circle cx="41" cy="29" r="3.5" fill="#334155" />
        <rect x="18" y="6" width="64" height="128" rx="14" fill="url(#shine)" />
        <defs>
          <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff" stop-opacity="0.35" />
            <stop offset="0.5" stop-color="#fff" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
    }
  `,
  styles: `
    :host { display: grid; place-items: center; background: var(--soft); border-radius: 12px; overflow: hidden; aspect-ratio: 1; }
    img { width: 100%; height: 100%; object-fit: cover; }
    svg { height: 78%; }
  `,
})
export class CaseImage {
  readonly src = input<string | null>(null);
  readonly color = input('');
  readonly alt = input('');

  protected readonly fill = computed(() => COLORS[this.color().trim().toLocaleLowerCase('bg')] ?? '#64748b');
  protected readonly transparent = computed(() => this.color().trim().toLocaleLowerCase('bg') === 'прозрачен');
}
