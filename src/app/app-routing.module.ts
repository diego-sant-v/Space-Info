import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsteroidesComponent } from './components/asteroides/asteroides.component';
import { HomeComponent } from './components/home/home.component';
import { TerraComponent } from './components/terra/terra.component';
import { MarsRoverComponent } from './components/mars-rover/mars-rover.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'asteroides', component: AsteroidesComponent},
  {path: 'terra', component: TerraComponent},
  {path: 'curiosity-rover', component: MarsRoverComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
