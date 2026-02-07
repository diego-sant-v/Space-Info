import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class EpicService {
  private apiKey = 'OoxtR8hnIJ09PfoR36H3BOF3iqIpftKGEqA0mOUt';
  private baseUrl = 'https://api.nasa.gov/EPIC';
  private imageBaseUrl = 'https://epic.gsfc.nasa.gov/archive';

  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  getLatestEpicImages(): Observable<any> {
    const url = `${this.baseUrl}/api/natural?api_key=${this.apiKey}`;
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  getEpicImagesByDate(date: Date): Observable<any> {
    const formattedDate = this.datePipe.transform(date, 'yyyy-MM-dd');
    const url = `${this.baseUrl}/api/natural/date/${formattedDate}?api_key=${this.apiKey}`;
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  buildImageUrl(image: any): string {
    // Parse the date from the image
    const date = new Date(image.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Format: https://epic.gsfc.nasa.gov/archive/natural/2015/10/31/png/epic_1b_20151031074844.png
    return `${this.imageBaseUrl}/natural/${year}/${month}/${day}/png/${image.image}.png`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      errorMessage = `Código do erro: ${error.status}\nMensagem: ${error.message}`;
      
      if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      } else if (error.status === 429) {
        errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
      } else if (error.status === 403) {
        errorMessage = 'Chave de API inválida ou acesso negado.';
      } else if (error.status === 404) {
        errorMessage = 'Nenhuma imagem encontrada para esta data.';
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
