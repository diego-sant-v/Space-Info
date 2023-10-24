import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { DatePipe } from '@angular/common';

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
      return this.http.get(this.url);
    } else {
      // Lida com a transformação mal-sucedida (por exemplo, tratamento de erro)
      throw new Error('Erro ao formatar datas');
    }
  }
}
