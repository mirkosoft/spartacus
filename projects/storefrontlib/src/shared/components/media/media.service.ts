import { Injectable } from '@angular/core';
import { Image, OccConfig } from '@spartacus/core';
import { MediaConfig, MediaFormatSize } from './media.config';
import { Media, MediaContainer } from './media.model';

/**
 * internal interface to map the mediaFormat object to a list
 */

@Injectable({
  providedIn: 'root',
})
export class MediaService {
  /**
   * The media formats sorted by size. The media format representing the smallest
   * size is sorted on top.
   */
  protected mediaFormats: Map<string, MediaFormatSize> = new Map();

  constructor(
    protected occConfig: OccConfig,
    protected mediaConfig: MediaConfig
  ) {
    this.buildFormatMap();
  }

  /**
   * Returns a `Media` object with the main media (`src`) and various media (`src`) for specific formats.
   *
   * @param container the `MediaContainer` that contains multiple media for different formats
   * @param format the format code that is used to select a specific media
   * @param alt the al text for the media
   */
  getMedia(
    container: MediaContainer | Image,
    format?: string,
    alt?: string
  ): Media {
    return {
      src: this.resolveSource(container, format),
      srcset: this.resolveSrcSet(container),
      alt: alt || this.getAlt(container, format),
    };
  }

  /**
   * Ceates the media formats to provide fast access to the media formats in a
   * logical order. The map contains the format key and the format size information.
   */
  protected buildFormatMap(): void {
    this.mediaFormats = new Map(
      Object.entries(
        this.mediaConfig.mediaFormats
      ).sort(([_o, oldFormat], [_n, format]) =>
        oldFormat.width < format.width ? 1 : -1
      )
    );
  }

  /**
   * Returns the main media for the given form. If there's no format given, or no media
   * available for the format, we fallback to the best format available. If this still not
   * resolves a media, a random media is returend.
   *
   * The main media is used for the main img `src` attribute. In many cases more specific media
   * are assigned to the img `srcset` attribute, which the browser will use to load the most
   * optimal media for the available media formats.
   */
  protected resolveSource(
    media: MediaContainer | Image,
    format?: string
  ): string {
    if (!media) {
      return;
    }

    return (
      this.resolveAbsoluteUrl(((media as any) as Image).url) ||
      this.resolveAbsoluteUrl(media[format]?.url) ||
      this.resolveAbsoluteUrl(media[this.findBestFormat(media)]?.url) ||
      this.resolveAbsoluteUrl(media[this.findRandomFormat(media)]?.url)
    );
  }

  /**
   * Returns the media format code with the best threshold, which indicates
   * the highest resolution for the media.
   */
  protected findBestFormat(media: MediaContainer | Image): string {
    const x = Array.from(this.mediaFormats)
      .reverse()
      .find(([code, _size]) => {
        media.hasOwnProperty(code);
      });

    return x ? x[0] : undefined;
  }

  protected findRandomFormat(media: MediaContainer | Image): string {
    return Object.keys(media)?.find(Boolean);
  }

  /**
   * Returns the alt text for the media. This is used as a fallback, in case there's no
   * alt text given by the caller of `getMedia`. The alt text is resolved from the media
   */
  protected getAlt(media: MediaContainer | Image, format?: string): string {
    return (
      ((media as any) as Image)?.altText ||
      media[format]?.altText ||
      media[this.findBestFormat(media)]?.altText ||
      media[this.findRandomFormat(media)]?.altText
    );
  }

  /**
   * Returns a set of media for the available media formats.
   */
  protected resolveSrcSet(media: MediaContainer | Image): string {
    if (!media) {
      return undefined;
    }

    const srcset = Array.from(this.mediaFormats).reduce(
      (set, [format, formatSize]) => {
        if (!!media[format]) {
          if (set) {
            set += ', ';
          }
          set += `${this.resolveAbsoluteUrl(media[format].url)} ${
            formatSize.width
          }w`;
        }
        return set;
      },
      ''
    );

    return srcset === '' ? undefined : srcset;
  }

  /**
   * Resolves the absolute URL for the given url. In most cases, this URL represents
   * the relative URL on the backend. In that case, we prefix the url with the baseUrl.
   */
  protected resolveAbsoluteUrl(url: string): string {
    if (!url) {
      return null;
    }
    return url.startsWith('http') ? url : this.getBaseUrl() + url;
  }

  /**
   * The base URL is either driven by a specific `backend.media.baseUrl`, or by the
   * `backend.occ.baseUrl`.
   *
   * The `backend.media.baseUrl` can be used to load media from a different location.
   *
   * In Commerce Cloud, a differnt location could mean a different "aspect".
   */
  protected getBaseUrl(): string {
    return (
      this.occConfig.backend.media.baseUrl ||
      this.occConfig.backend.occ.baseUrl ||
      ''
    );
  }
}
