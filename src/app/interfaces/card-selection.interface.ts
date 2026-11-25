export interface ICardSelection {
	/** Empty for a blank card. */
	imageUrl: string;
	routerLink: string;
	/** URL fragment (after `#`) added to `routerLink` */
	fragment?: string;
	title: string;
	desc?: string;
}
