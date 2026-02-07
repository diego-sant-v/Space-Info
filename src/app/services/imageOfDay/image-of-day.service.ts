import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ImageOfDayService {
  key = "OoxtR8hnIJ09PfoR36H3BOF3iqIpftKGEqA0mOUt"
  dateSelected = new Date();//YYYY-MM-DD
  url = '';
  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  getImageOfDay(dateSelected: Date): Observable<any> { 
    const dateSelectedFormated = this.datePipe.transform(dateSelected,"yyyy-MM-dd");

    if (dateSelectedFormated) {
      this.url = `https://api.nasa.gov/planetary/apod?start_date=${dateSelectedFormated}&api_key=${this.key}`;
      return this.http.get(this.url).pipe(
        catchError(this.handleError)
      );
    } else {
      return throwError(() => new Error('Erro ao formatar datas'));
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocorreu um erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      errorMessage = `Código do erro: ${error.status}\nMensagem: ${error.message}`;
      
      if (error.status === 0) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      } else if (error.status === 429) {
        errorMessage = 'Limite de requisições excedido. Tente novamente mais tarde.';
      } else if (error.status === 403) {
        errorMessage = 'Chave de API inválida ou acesso negado.';
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
