import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { SampleMessage } from '../../models/sample-message';

@Component({
  selector: 'app-sample-messages',
  standalone: true,
  templateUrl: './sample-messages.component.html',
  styleUrl: './sample-messages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SampleMessagesComponent {
  @Input() samples: SampleMessage[] = [];
  @Output() sampleSelected = new EventEmitter<string>();
}
