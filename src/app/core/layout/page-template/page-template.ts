import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
	Component,
	DestroyRef,
	ElementRef,
	Injector,
	OnInit,
	PLATFORM_ID,
	PendingTasks,
	Type,
	afterNextRender,
	inject,
	viewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageOutlet } from 'src/app/core/layout/page-template/page-outlet';
import { Navbar } from '../navbar/navbar';
import { Contact } from '../../../shared/ui/contact/contact';
import { Footer } from '../footer/footer';
import { StatusBanner } from '../status-banner/status-banner';
import {
	BrowserStorage,
	STORAGE_KEYS
} from 'src/app/core/browser-storage/browser-storage';

@Component({
	selector: 'app-page-template',
	templateUrl: './page-template.html',
	styleUrls: ['./page-template.scss'],
	imports: [StatusBanner, Navbar, PageOutlet, Contact, Footer]
})
export class PageTemplate implements OnInit {
	private route = inject(ActivatedRoute);
	private router = inject(Router);
	private destroyRef = inject(DestroyRef);
	private pendingTasks = inject(PendingTasks);
	private document = inject(DOCUMENT);
	private injector = inject(Injector);
	// Read now: by the time the page has loaded, the first navigation has ended.
	private isInAppNavigation = this.router.navigated;
	private storage = inject(BrowserStorage);
	private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
	private mainContent =
		viewChild.required<ElementRef<HTMLElement>>('mainContent');

	public showContactSection: boolean;
	public isTransparent!: boolean;
	public showFooter: boolean;
	/** Off for pages with their own app bar (the admin tools). */
	public showNavbar: boolean;

	// Rendered by the first change detection, before the page's chunk loads.
	private pageHost = viewChild.required(PageOutlet);

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
		this.showNavbar = this.route.snapshot.data['showNavbar'] ?? true;
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
				this.pageHost().viewContainerRef.createComponent(component);
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
			this.storage.remove('session', STORAGE_KEYS.chunkReload);
			return component;
		} catch (error) {
			const hasReloaded =
				this.storage.get('session', STORAGE_KEYS.chunkReload) !== null;
			if (!this.isBrowser || hasReloaded) {
				throw error;
			}
			this.storage.set('session', STORAGE_KEYS.chunkReload, 'true');
			this.document.location.reload();
			return null;
		}
	}
}
