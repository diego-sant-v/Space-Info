import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { TypePhotos } from 'src/app/models/rover/type-photos.model';
import { DatePipe } from '@angular/common';

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
    return this.http.get(this.url)
  }
}
