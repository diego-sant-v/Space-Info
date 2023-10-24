import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ImageOfDayService } from 'src/app/services/imageOfDay/image-of-day.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  startDateInfo: any;
  endDateInfo: any;
  DateInfo: any;
  dateSelected: any;
  isLoading!: Boolean;
  infoImage: any;

  constructor(private imageOfDayService : ImageOfDayService, private datePipe: DatePipe) { }
  getImageOfDayByDate(dateSelected: any) {
    this.isLoading = true;
    this.imageOfDayService.getImageOfDay(dateSelected).subscribe(
      (data) => {
        console.log('teste malucoide', data)
        this.infoImage = data;
        this.isLoading = false;
      }
    )
  }

  ngOnInit() {
    this.dateSelected = new Date();
    console.log('treste no data', this.dateSelected)
    this.getImageOfDayByDate(this.dateSelected);
  }
}
