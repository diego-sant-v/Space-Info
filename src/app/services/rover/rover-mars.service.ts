import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { TypePhotos } from 'src/app/models/rover/type-photos.model';
import { DatePipe } from '@angular/common';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoverMarsService {
  key = "OoxtR8hnIJ09PfoR36H3BOF3iqIpftKGEqA0mOUt"
  url = '';
  dateSelected = new Date();//YYYY-MM-DD
  constructor(private http: HttpClient, private datePipe: DatePipe) { }
  
  getRoverMarsPhotos(typePhoto: TypePhotos, dateSelected: any): Observable<any>{
    const formattedSelectedDate = this.datePipe.transform(dateSelected,"yyyy-MM-dd");
    this.url = `https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?earth_date=${formattedSelectedDate}&camera=${typePhoto}&api_key=${this.key}`
    return this.http.get(this.url).pipe(
      catchError(this.handleError)
    );
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
        errorMessage = 'Data inválida ou fora do alcance do rover.';
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
