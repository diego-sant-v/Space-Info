import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DonkiService {
  private apiKey = 'OoxtR8hnIJ09PfoR36H3BOF3iqIpftKGEqA0mOUt';
  private baseUrl = 'https://api.nasa.gov/DONKI';

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  /**
   * Coronal Mass Ejection (CME) - Ejeções de Massa Coronal
   */
  getCME(startDate: Date, endDate: Date): Observable<any> {
    const start = this.datePipe.transform(startDate, 'yyyy-MM-dd');
    const end = this.datePipe.transform(endDate, 'yyyy-MM-dd');
    const url = `${this.baseUrl}/CME?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  /**
   * Geomagnetic Storm (GST) - Tempestades Geomagnéticas
   */
  getGST(startDate: Date, endDate: Date): Observable<any> {
    const start = this.datePipe.transform(startDate, 'yyyy-MM-dd');
    const end = this.datePipe.transform(endDate, 'yyyy-MM-dd');
    const url = `${this.baseUrl}/GST?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  /**
   * Solar Flare (FLR) - Explosões Solares
   */
  getSolarFlare(startDate: Date, endDate: Date): Observable<any> {
    const start = this.datePipe.transform(startDate, 'yyyy-MM-dd');
    const end = this.datePipe.transform(endDate, 'yyyy-MM-dd');
    const url = `${this.baseUrl}/FLR?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  /**
   * Solar Energetic Particle (SEP) - Partículas Energéticas Solares
   */
  getSEP(startDate: Date, endDate: Date): Observable<any> {
    const start = this.datePipe.transform(startDate, 'yyyy-MM-dd');
    const end = this.datePipe.transform(endDate, 'yyyy-MM-dd');
    const url = `${this.baseUrl}/SEP?startDate=${start}&endDate=${end}&api_key=${this.apiKey}`;
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  /**
   * Busca todos os dados de clima espacial de uma vez
   */
  getAllSpaceWeather(startDate: Date, endDate: Date): Observable<any> {
    return forkJoin({
      cme: this.getCME(startDate, endDate),
      gst: this.getGST(startDate, endDate),
      flr: this.getSolarFlare(startDate, endDate),
      sep: this.getSEP(startDate, endDate)
    });
  }

  /**
   * Classifica o nível de perigo da tempestade geomagnética (Kp index)
   */
  getStormLevel(kpIndex: number): { level: string; color: string; description: string } {
    if (kpIndex >= 8) return { level: 'EXTREMO', color: '#ff0040', description: 'Tempestade geomagnética extrema' };
    if (kpIndex >= 7) return { level: 'SEVERO', color: '#ff4500', description: 'Tempestade geomagnética severa' };
    if (kpIndex >= 6) return { level: 'FORTE', color: '#ff8c00', description: 'Tempestade geomagnética forte' };
    if (kpIndex >= 5) return { level: 'MODERADO', color: '#ffd700', description: 'Tempestade geomagnética moderada' };
    if (kpIndex >= 4) return { level: 'MENOR', color: '#98fb98', description: 'Tempestade geomagnética menor' };
    return { level: 'CALMO', color: '#00ff88', description: 'Atividade geomagnética normal' };
  }

  /**
   * Classifica a intensidade da explosão solar
   */
  getFlareIntensity(classType: string): { level: string; color: string; description: string } {
    if (!classType) return { level: 'N/A', color: '#666', description: 'Sem classificação' };
    const letter = classType.charAt(0).toUpperCase();
    switch (letter) {
      case 'X': return { level: 'EXTREMA', color: '#ff0040', description: 'Explosão solar de classe X - Extremamente intensa' };
      case 'M': return { level: 'FORTE', color: '#ff8c00', description: 'Explosão solar de classe M - Forte' };
      case 'C': return { level: 'MODERADA', color: '#ffd700', description: 'Explosão solar de classe C - Moderada' };
      case 'B': return { level: 'FRACA', color: '#98fb98', description: 'Explosão solar de classe B - Fraca' };
      case 'A': return { level: 'MÍNIMA', color: '#00ff88', description: 'Explosão solar de classe A - Mínima' };
      default: return { level: classType, color: '#666', description: 'Classificação desconhecida' };
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro desconhecido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      if (error.status === 0) errorMessage = 'Sem conexão com o servidor.';
      else if (error.status === 429) errorMessage = 'Limite de requisições excedido. Tente mais tarde.';
      else if (error.status === 403) errorMessage = 'Chave de API inválida.';
      else errorMessage = `Erro ${error.status}: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
