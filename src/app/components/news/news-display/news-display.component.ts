import { Component, Input } from '@angular/core';
import { INewsItem } from 'src/app/interfaces/news-item.interface';

@Component({
    selector: 'app-news-display',
    templateUrl: './news-display.component.html',
    styleUrls: ['./news-display.component.scss'],
    standalone: false
})
export class NewsDisplayComponent {
    @Input({ required: true }) public newsItems!: INewsItem[];

    public date!: Date;
    public test = '';

    public newsItemToDateString(item: INewsItem): string {
        return new Date(item.date).toDateString();
    }

    public isBannerImageValid(bannerImg: string | undefined): boolean {
        if (bannerImg && bannerImg.length > 0) {
            return true;
        }

        return false;
    }
}
