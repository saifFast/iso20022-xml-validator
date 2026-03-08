import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { XmlValidatorComponent } from './components/xml-validator.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, XmlValidatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('');
}