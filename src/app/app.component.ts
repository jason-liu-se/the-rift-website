import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BannerComponent } from './layout/banner/banner.component';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	imports: [BannerComponent, RouterOutlet]
})
export class AppComponent {
	title = 'the-rift-site';
}
