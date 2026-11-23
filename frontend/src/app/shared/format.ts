import { Pipe, PipeTransform } from '@angular/core';

const euro = new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' });
const mm = new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' });

/** 12.9 -> "12,90 €" */
@Pipe({ name: 'eur' })
export class EuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : euro.format(value);
  }
}

/** Phone size: "146,7 × 71,5 × 7,4 мм" */
@Pipe({ name: 'size' })
export class SizePipe implements PipeTransform {
  transform(p: { heightMm: number | null; widthMm: number | null; thicknessMm: number | null }): string {
    if (p.heightMm === null || p.widthMm === null || p.thicknessMm === null) {
      const known = [
        ['височина', p.heightMm],
        ['ширина', p.widthMm],
        ['дебелина', p.thicknessMm],
      ].filter(([, v]) => v !== null);
      return known.length ? known.map(([label, v]) => `${label} ${mm.format(v as number)} мм`).join(', ') : '—';
    }
    return `${mm.format(p.heightMm)} × ${mm.format(p.widthMm)} × ${mm.format(p.thicknessMm)} мм`;
  }
}

/** SQLite time ("2026-11-21 10:00:00", UTC) -> local date and time */
@Pipe({ name: 'when' })
export class WhenPipe implements PipeTransform {
  transform(value: string): string {
    return date.format(new Date(`${value.replace(' ', 'T')}Z`));
  }
}
