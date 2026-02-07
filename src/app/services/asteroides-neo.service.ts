import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { DatePipe } from '@angular/common';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AsteroidesNeoService {
  /* 
    Observable:
    Um Observable é um objeto que representa uma sequência de dados ao longo do tempo.
    Ele é usado para lidar com eventos assíncronos, como requisições HTTP, eventos de usuário, ou 
    qualquer outra operação que ocorre em um período prolongado.
  */
  key = "OoxtR8hnIJ09PfoR36H3BOF3iqIpftKGEqA0mOUt"
  startDate = new Date();//YYYY-MM-DD
  endDate = new Date();//YYYY-MM-DD
  url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${this.startDate}&end_date=${this.endDate}&api_key=${this.key}`
  constructor(private http: HttpClient, private datePipe: DatePipe) { }

  getAsteroidesNeo(startDate: Date, endDate: Date): Observable<any> { 
    const formattedStartDate = this.datePipe.transform(startDate,"yyyy-MM-dd");
    const formattedEndDate = this.datePipe.transform(endDate,"yyyy-MM-dd");

    if (formattedStartDate && formattedEndDate) {
      this.url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${formattedStartDate}&end_date=${formattedEndDate}&api_key=${this.key}`;
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
      } else if (error.status === 400) {
        errorMessage = 'Intervalo de datas inválido. O máximo é 7 dias.';
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
