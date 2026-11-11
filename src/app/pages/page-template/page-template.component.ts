import {
	Component,
	DestroyRef,
	ElementRef,
	OnInit,
	ViewChild,
	Type,
	afterNextRender,
	inject,
	viewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageTemplateDirective } from 'src/app/directives/page-template.directive';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ContactComponent } from '../../components/contact/contact.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
	selector: 'app-page-template',
	templateUrl: './page-template.component.html',
	styleUrls: ['./page-template.component.scss'],
	imports: [
		NavbarComponent,
		PageTemplateDirective,
		ContactComponent,
		FooterComponent
	]
})
export class PageTemplateComponent implements OnInit {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private destroyRef = inject(DestroyRef);
	private mainContent =
		viewChild.required<ElementRef<HTMLElement>>('mainContent');

	public showContactSection: boolean;
	public isTransparent!: boolean;
	public showFooter: boolean;

	@ViewChild(PageTemplateDirective, { static: true })
	appPageTemplateHost!: PageTemplateDirective;

	constructor() {
		// setting values from the passed URL data
		const isTransparentProp = this.route.snapshot.data['isTransparent'];
		const showContactSectionProp =
			this.route.snapshot.data['showContactSection'];
		const showFooterProp = this.route.snapshot.data['showFooter'];

		this.isTransparent =
			isTransparentProp == null ? true : isTransparentProp;
		this.showContactSection =
			showContactSectionProp == null ? false : showContactSectionProp;
		this.showFooter = showFooterProp == null ? true : showFooterProp;

		// After an in-app navigation (not the first page load), start keyboard
		// and screen reader users at the new page's content instead of <body>.
		if (this.router.navigated) {
			afterNextRender(() =>
				this.mainContent().nativeElement.focus({ preventScroll: true })
			);
		}
	}

	// Pages are loaded on demand (their own JS chunks) from data.loadComponent.
	async ngOnInit(): Promise<void> {
		const loadComponent: () => Promise<Type<unknown>> =
			this.route.snapshot.data['loadComponent'];
		const component = await loadComponent();
		// The user may have navigated away while the page's chunk was loading.
		if (!this.destroyRef.destroyed) {
			this.appPageTemplateHost.viewContainerRef.createComponent(
				component
			);
		}
	}
}
