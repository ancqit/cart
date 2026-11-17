import { Component, input, output } from '@angular/core';
import { describeSchedule, money } from '../flow';
import { Slip } from '../models';

@Component({
  selector: 'app-slip',
  templateUrl: './slip.html',
})
export class SlipCard {
  readonly slip = input.required<Slip>();
  readonly showArrive = input(false);
  readonly busy = input(false);
  readonly arrived = output<void>();
  readonly money = money;
  readonly describeSchedule = describeSchedule;
}
