import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, timer, switchMap, shareReplay, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IssService {
  private issUrl = 'https://api.wheretheiss.at/v1/satellites/25544';
  private peopleUrl = 'http://api.open-notify.org/astros.json';

  constructor(private http: HttpClient) { }

  /**
   * Posição atual da ISS
   */
  getISSPosition(): Observable<any> {
    return this.http.get(this.issUrl).pipe(
      catchError(() => of({ latitude: 0, longitude: 0, altitude: 408, velocity: 27600, visibility: 'daylight' }))
    );
  }

  /**
   * Posição da ISS atualizada a cada 3 segundos
   */
  trackISS(intervalMs: number = 3000): Observable<any> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getISSPosition()),
      shareReplay(1)
    );
  }

  /**
   * Pessoas no espaço agora
   */
  getPeopleInSpace(): Observable<any> {
    return this.http.get(this.peopleUrl).pipe(
      catchError(() => of({ number: 0, people: [] }))
    );
  }
}
