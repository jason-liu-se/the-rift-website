import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { publishScrollbarGap } from './core/layout/publish-scrollbar-gap';
import { SessionEndedService } from './core/layout/session-ended/session-ended.service';

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
		publishScrollbarGap();
	}
}
