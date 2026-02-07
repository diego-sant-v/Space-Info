import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private cache = new Map<string, string>();
  private translationQueue: { text: string, resolve: (value: string) => void }[] = [];
  private isProcessing = false;

  constructor(private http: HttpClient) {}

  translate(text: string): Observable<string> {
    if (!text || text.trim().length === 0) {
      return of(text);
    }

    // Limita para 497 caracteres (API MyMemory tem limite de 500)
    let textToTranslate = text;
    let wasTruncated = false;
    
    if (text.length > 497) {
      textToTranslate = text.substring(0, 497);
      wasTruncated = true;
    }

    // Verifica se já está em cache
    const cacheKey = text.length > 497 ? text.substring(0, 497) : text;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey)!);
    }

    // Usa API gratuita MyMemory para tradução
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|pt`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && response.responseData && response.responseData.translatedText) {
          let translated = response.responseData.translatedText;
          
          // Adiciona "..." se o texto foi truncado
          if (wasTruncated) {
            translated += '...';
          }
          
          this.cache.set(cacheKey, translated);
          return translated;
        }
        return text; // Retorna original se falhar
      }),
      catchError(() => {
        return of(text); // Em caso de erro, retorna texto original
      })
    );
  }
}
