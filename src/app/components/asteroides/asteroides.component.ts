import { Component, OnInit } from '@angular/core';
import { Asteroides } from 'src/app/models/asteroides.model';
import { AsteroidesNeoService } from 'src/app/services/asteroides-neo.service';

@Component({
  selector: 'app-asteroides',
  templateUrl: './asteroides.component.html',
  styleUrls: ['./asteroides.component.scss']
})
export class AsteroidesComponent implements OnInit {

  asteroidesObj: Asteroides = new Asteroides;
  asteroidesNear:any;
  startDateInfo: any;
  endDateInfo: any;
  DateInfo: any;
  startDateSelected:any;
  endDateSelected:any;
  isLoading!: Boolean;
  constructor(private asteroidesService: AsteroidesNeoService) {

  }


  ngOnInit(): void {
    //this.getAsteroidesByDate()
  }

  getAsteroidesByDate(startDate:Date, endDate:Date) {
    this.isLoading = true;
    console.log('no get asteroides', startDate, endDate)
    //subscribe é um método usado para se inscrever em um Observable e receber os valores emitidos por ele.
    this.asteroidesService.getAsteroidesNeo(startDate, endDate).subscribe(
      (data) => {
        console.log('teste no data', data)
        this.asteroidesObj = data;
        this.parseAsteroidesNear(this.asteroidesObj.near_earth_objects)
        console.log('testes', this.startDateInfo, this.endDateInfo)
        this.isLoading = false;
      },
      (error) => {
        console.log('deu erro', error)
      }
    )
  }

  parseAsteroidesNear(param : any) {
    console.log('nos asteroides', param)
    this.asteroidesNear = Object.values(param).flat();
    console.log('no near', this.asteroidesNear)
  }


}


