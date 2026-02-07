import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translate'
})
export class TranslatePipe implements PipeTransform {
  private cache = new Map<string, string>();

  transform(value: string): string {
    if (!value) return value;
    
    // Retorna do cache se já foi traduzido
    if (this.cache.has(value)) {
      return this.cache.get(value)!;
    }

    // Por enquanto, retorna o original (será traduzido pelo componente)
    return value;
  }
}
