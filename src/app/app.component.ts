import { Component, ElementRef, OnInit, ViewChild, EventEmitter } from '@angular/core';
import { select as d3select, mouse as d3mouse } from 'd3-selection';
import {  scaleLinear } from 'd3-scale';
import { Observable } from 'rxjs';
import { PythagorasModel } from './pythagoras/pythagoras.component';

const svgDimensions = {
  width: 1280,
  height: 600
};
const realMax = 11;
const baseW = 80;

const scaleFactor =
  scaleLinear().domain([svgDimensions.height, 0]).range([0, .8]);
const scaleLean =
  scaleLinear().domain([0, svgDimensions.width / 2, svgDimensions.width]).range([.5, 0, -.5]);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  svgDimensions = svgDimensions;
  pythagoras: PythagorasModel = {
    w: baseW,
    heightFactor: 0,
    lean: 0,
    x: svgDimensions.width / 2 - 40,
    y: svgDimensions.height - baseW,
    lvl: 0,
    maxlvl: 0
  };

  onMouseMove$ = new EventEmitter<MouseEvent>();

  ngOnInit() {
    let running = false;

    const factorAndLean$ = this.onMouseMove$
      .filter(() => !running)
      .do(() => running = true)
      .map((mouseEvent: MouseEvent) => {
        const { offsetX: x, offsetY: y } = mouseEvent;
        return {
          heightFactor: scaleFactor(y),
          lean: scaleLean(x)
        };
      })
      .startWith({ heightFactor: 0, lean: 0 });

    Observable.combineLatest(
        factorAndLean$,
        Observable.interval(100).timeInterval().take(realMax)
      )
      .subscribe(([{ heightFactor, lean }, maxlvl]) => {
        this.pythagoras = Object.assign({}, this.pythagoras, {
          heightFactor,
          lean,
          maxlvl: maxlvl.value + 1
        });
        running = false;
      });
  }

}
