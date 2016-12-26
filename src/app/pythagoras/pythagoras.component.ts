import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit, OnChanges } from '@angular/core';
import { interpolateViridis } from 'd3-scale';

function deg(radians) {
  return radians * (180 / Math.PI);
};

const memoizedCalc = function (): (any) => { nextRight: number, nextLeft: number, A: number, B: number } {
  const memo = {};

  const key = ({ w, heightFactor, lean }) => [w, heightFactor, lean].join('-');

  return (args) => {
    const memoKey = key(args);

    if (memo[memoKey]) {
      return memo[memoKey];
    } else {
      const { w, heightFactor, lean } = args;

      const trigH = heightFactor * w;

      const result = {
        nextRight: Math.sqrt(trigH ** 2 + (w * (.5 + lean)) ** 2),
        nextLeft: Math.sqrt(trigH ** 2 + (w * (.5 - lean)) ** 2),
        A: deg(Math.atan(trigH / ((.5 - lean) * w))),
        B: deg(Math.atan(trigH / ((.5 + lean) * w)))
      };

      memo[memoKey] = result;
      return result;
    }
  };
} ();

export type PythagorasDirection = 'left' | 'right';
export interface PythagorasModel {
  w: number;
  x: number;
  y: number;
  heightFactor: number;
  lean: number;
  direction?: PythagorasDirection;
  lvl: number;
  maxlvl: number;
};

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[pythagoras]',
  templateUrl: './pythagoras.component.html',
  styleUrls: ['./pythagoras.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PythagorasComponent {
  pythagorasParent: PythagorasModel;
  pythagorasLeft: PythagorasModel;
  pythagorasRight: PythagorasModel;

  fill: string;
  rotate: string;

  get pythagoras() { return this.pythagorasParent; }
  @Input('pythagoras') set pythagoras(pythagoras: PythagorasModel) {
    this.pythagorasParent = pythagoras;
    if (!pythagoras) {
      return;
    }

    const calc = memoizedCalc({
      w: pythagoras.w,
      heightFactor: pythagoras.heightFactor,
      lean: pythagoras.lean
    });

    this.fill = this.getFill(pythagoras.lvl, pythagoras.maxlvl);
    this.rotate = this.getRotate(pythagoras.direction, calc.A, calc.B);

    this.pythagorasLeft = this.getChildPythagoras('left', calc.nextLeft);
    this.pythagorasRight = this.getChildPythagoras('right', calc.nextRight);
  };

  getChildPythagoras(direction: PythagorasDirection, nextW: number) {
    const lvl = this.pythagoras.lvl + 1;
    if (nextW < 1 || lvl >= this.pythagoras.maxlvl) {
      return null;
    }

    return Object.assign({}, this.pythagoras, {
      direction,
      lvl,
      w: nextW,
      x: direction === 'left' ? 0 : this.pythagoras.w - nextW,
      y: -nextW
    });
  }

  @HostBinding('attr.transform') get transform() {
    if (!this.pythagoras) {
      return '';
    }
    return `translate(${this.pythagoras.x} ${this.pythagoras.y}) ${this.rotate}`;
  }

  private getRotate(direction: PythagorasDirection, calcA: number, calcB: number) {
    switch (direction) {
      case 'left':
        return `rotate(${-calcA} 0 ${this.pythagoras.w})`;
      case 'right':
        return `rotate(${calcB} ${this.pythagoras.w} ${this.pythagoras.w})`;
      default:
        return '';
    }
  }

  getFill(lvl: number, maxlvl: number) {
    return interpolateViridis(lvl / maxlvl);
  }
}
