import { Component, OnInit, ViewChild, Type, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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

	public showContactSection: boolean;
	public mainComponent: Type<unknown>;
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
		this.mainComponent = this.route.snapshot.data['component'];
		this.showContactSection =
			showContactSectionProp == null ? false : showContactSectionProp;
		this.showFooter = showFooterProp == null ? true : showFooterProp;
	}

	// displaying the passed component dynamically
	displayComponent(): void {
		const viewContainerRef = this.appPageTemplateHost.viewContainerRef;
		viewContainerRef.clear();

		viewContainerRef.createComponent(this.mainComponent);
	}

	ngOnInit(): void {
		this.displayComponent();
	}
}
