import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
	Component,
	DestroyRef,
	ElementRef,
	Injector,
	OnInit,
	PLATFORM_ID,
	PendingTasks,
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

/** sessionStorage key set while reloading after a page chunk failed to load. */
export const CHUNK_RELOAD_KEY = 'reloaded-after-chunk-error';

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
	private pendingTasks = inject(PendingTasks);
	private document = inject(DOCUMENT);
	private injector = inject(Injector);
	// Read now: by the time the page has loaded, the first navigation has ended.
	private isInAppNavigation = this.router.navigated;
	private storage = isPlatformBrowser(inject(PLATFORM_ID))
		? sessionStorage
		: null;
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
	}

	// Pages are loaded on demand (their own JS chunks) from data.loadComponent.
	async ngOnInit(): Promise<void> {
		// Keeps the app unstable until the page is in place, so server rendering
		// and hydration wait for it instead of finishing without it.
		const removeTask = this.pendingTasks.add();
		try {
			const component = await this.loadPage();
			// The user may have navigated away while the page's chunk was loading.
			if (component && !this.destroyRef.destroyed) {
				this.appPageTemplateHost.viewContainerRef.createComponent(
					component
				);
				this.focusContentAfterNavigation();
			}
		} finally {
			removeTask();
		}
	}

	/**
	 * After an in-app navigation (not the first page load), starts keyboard and
	 * screen reader users at the new page's content instead of <body>. Waits for
	 * the page, so Tab from <main> reaches its content.
	 */
	private focusContentAfterNavigation(): void {
		if (this.isInAppNavigation) {
			afterNextRender(
				() =>
					this.mainContent().nativeElement.focus({
						preventScroll: true
					}),
				{ injector: this.injector }
			);
		}
	}

	/**
	 * Loads the page component. A tab opened before a deploy asks for chunk
	 * files that no longer exist, so on failure the page reloads once to get the
	 * new build (returning null); a second failure in a row is a real error.
	 */
	private async loadPage(): Promise<Type<unknown> | null> {
		const loadComponent: () => Promise<Type<unknown>> =
			this.route.snapshot.data['loadComponent'];
		try {
			const component = await loadComponent();
			this.storage?.removeItem(CHUNK_RELOAD_KEY);
			return component;
		} catch (error) {
			if (!this.storage || this.storage.getItem(CHUNK_RELOAD_KEY)) {
				throw error;
			}
			this.storage.setItem(CHUNK_RELOAD_KEY, 'true');
			this.document.location.reload();
			return null;
		}
	}
}
