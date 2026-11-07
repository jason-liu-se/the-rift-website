import { ICardSelection } from './card-selection.interface';

export interface IGalleryCardSelection extends ICardSelection {
	dbCollectionName: string;
}
