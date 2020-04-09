export abstract class MediaConfig {
  media?: {
    /**
     * Specifies the _threshold_ for a given format. The threshold is used to ...
     */
    thresholds?: MediaThreshold;
  };
}

export interface MediaThreshold {
  [format: string]: number;
}
