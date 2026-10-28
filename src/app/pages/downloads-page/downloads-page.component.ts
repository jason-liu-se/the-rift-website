import { DownloadsProviderService } from './../../services/downloads-provider.service';
import { BackgroundImageCardComponent } from './../../components/background-image-card/background-image-card.component';
import { Component } from '@angular/core';
import { IDownloadCollection } from 'src/app/interfaces/download-collection.interface';

@Component({
    selector: 'app-downloads-page',
    templateUrl: './downloads-page.component.html',
    styleUrls: ['./downloads-page.component.scss'],
    standalone: false
})
export class DownloadsPageComponent {
    public downloadCollections!: IDownloadCollection[];

    constructor(private downloadsProvider: DownloadsProviderService) {
        this.downloadsProvider
            .getDownloadCollections()
            .subscribe(
                (data: IDownloadCollection[]) =>
                    (this.downloadCollections = data)
            );
    }
}
