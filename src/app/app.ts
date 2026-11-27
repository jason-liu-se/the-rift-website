import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { publishScrollbarGap } from './core/layout/publish-scrollbar-gap';
import { SessionEndWatcher } from './core/layout/session-ended/session-end-watcher';

@Component({
	selector: 'app-root',
	templateUrl: './app.html',
	styleUrls: ['./app.scss'],
	imports: [RouterOutlet]
})
export class App {
	title = 'the-rift-site';

	constructor() {
		// Before the first navigation, so a fresh load's expired session is told.
		inject(SessionEndWatcher).start();
		publishScrollbarGap();
	}
}
