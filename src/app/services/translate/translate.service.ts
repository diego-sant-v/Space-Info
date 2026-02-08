import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map, catchError, delay, concatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private cache = new Map<string, string>();
  private queue$ = new Subject<{ text: string; fullKey: string; callback: (result: string) => void }>();

  constructor(private http: HttpClient) {
    this.queue$.pipe(
      concatMap(item => this.doTranslate(item.text, item.fullKey).pipe(
        map(result => ({ result, callback: item.callback })),
        delay(200)
      ))
    ).subscribe(({ result, callback }) => callback(result));
  }

  translate(text: string): Observable<string> {
    if (!text || text.trim().length === 0) {
      return of(text);
    }

    if (this.cache.has(text)) {
      return of(this.cache.get(text)!);
    }

    return new Observable<string>(observer => {
      this.queue$.next({
        text,
        fullKey: text,
        callback: (result: string) => {
          observer.next(result);
          observer.complete();
        }
      });
    });
  }

  private doTranslate(text: string, cacheKey: string): Observable<string> {
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey)!);
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response && Array.isArray(response[0])) {
          const translated = response[0]
            .map((part: any[]) => part[0])
            .join('');
          this.cache.set(cacheKey, translated);
          return translated;
        }
        return text;
      }),
      catchError(() => of(text))
    );
  }
}
