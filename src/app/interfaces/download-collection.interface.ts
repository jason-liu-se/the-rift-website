import { IDownloadItem } from './download-item.interface';

export interface IDownloadCollection {
	name: string;
	items: IDownloadItem[];
}
