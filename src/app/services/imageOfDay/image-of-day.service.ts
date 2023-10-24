import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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
      return this.http.get(this.url);
    } else {
      // Lida com a transformação mal-sucedida (por exemplo, tratamento de erro)
      throw new Error('Erro ao formatar datas');
    }
  }
}
