import { Component, ChangeDetectionStrategy } from '@angular/core';
import { XmlValidatorComponent } from './components/xml-validator.component';

@Component({
  selector: 'app-root',
  imports: [XmlValidatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
