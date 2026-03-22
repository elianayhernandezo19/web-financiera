import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-top-volume',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './top-volume.component.html',
  styleUrl: './top-volume.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopVolumeComponent {
  readonly data = input.required<{ symbol: string; date: string; volume: number }[]>();
}
