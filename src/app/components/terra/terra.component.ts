import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-terra',
  templateUrl: './terra.component.html',
  styleUrls: ['./terra.component.scss']
})
export class TerraComponent implements OnInit {
  earthFacts = [
    {
      icon: '🌍',
      title: 'Diâmetro',
      value: '12.742 km',
      description: 'Diâmetro equatorial da Terra'
    },
    {
      icon: '⏱️',
      title: 'Rotação',
      value: '23h 56min',
      description: 'Período de rotação (1 dia)'
    },
    {
      icon: '🔄',
      title: 'Translação',
      value: '365,25 dias',
      description: 'Período orbital (1 ano)'
    },
    {
      icon: '🌡️',
      title: 'Temperatura',
      value: '15°C',
      description: 'Temperatura média da superfície'
    },
    {
      icon: '🌊',
      title: 'Água',
      value: '71%',
      description: 'Superfície coberta por água'
    },
    {
      icon: '☀️',
      title: 'Distância do Sol',
      value: '149,6 milhões km',
      description: '1 Unidade Astronômica (UA)'
    },
    {
      icon: '🌙',
      title: 'Satélites',
      value: '1 (Lua)',
      description: 'Satélite natural da Terra'
    },
    {
      icon: '💪',
      title: 'Gravidade',
      value: '9,8 m/s²',
      description: 'Aceleração da gravidade'
    },
    {
      icon: '🌬️',
      title: 'Atmosfera',
      value: '78% N2, 21% O2',
      description: 'Composição atmosférica principal'
    },
    {
      icon: '🧠',
      title: 'Idade',
      value: '4,5 bilhões anos',
      description: 'Idade estimada da Terra'
    },
    {
      icon: '👥',
      title: 'População',
      value: '8 bilhões',
      description: 'População humana aproximada'
    },
    {
      icon: '🏔️',
      title: 'Ponto mais alto',
      value: '8.848 m',
      description: 'Monte Everest'
    }
  ];

  earthLayers = [
    {
      name: 'Crosta',
      depth: '0-70 km',
      description: 'Camada mais externa e fina, onde vivemos',
      color: '#8B4513'
    },
    {
      name: 'Manto Superior',
      depth: '70-670 km',
      description: 'Rocha sólida e quente que flui lentamente',
      color: '#D2691E'
    },
    {
      name: 'Manto Inferior',
      depth: '670-2.900 km',
      description: 'Rocha densa sob alta pressão',
      color: '#CD853F'
    },
    {
      name: 'Núcleo Externo',
      depth: '2.900-5.150 km',
      description: 'Líquido de ferro e níquel fundidos',
      color: '#FF6347'
    },
    {
      name: 'Núcleo Interno',
      depth: '5.150-6.371 km',
      description: 'Esfera sólida de ferro e níquel',
      color: '#DC143C'
    }
  ];

  ngOnInit(): void {
  }
}
