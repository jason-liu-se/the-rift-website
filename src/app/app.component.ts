import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionEndedService } from './layout/session-ended/session-ended.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [RouterOutlet]
})
export class AppComponent {
	title = 'the-rift-site';

	constructor() {
		// Before the first navigation, so a fresh load's expired session is told.
		inject(SessionEndedService).start();
	}
}
