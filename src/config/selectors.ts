type ZoneSelectors = Record<string, string>;

type SiteMap = {
  zones: Array<{
    match: (path: string) => boolean;
    selectors: ZoneSelectors;
  }>;
};

const selectorMap: Record<string, SiteMap> = {
  'primevideo.com': {
    zones: [
      {
        match: (path) => path === '/' || path === '',
        selectors: {
          search_button: "[aria-label='Search']",
          nav_home: "[aria-label='Home']",
        },
      },
      {
        match: (path) => path.startsWith('/search'),
        selectors: {
          first_result: ".search-results [data-testid='title-card']:first-child",
          all_results: ".search-results [data-testid='title-card']",
        },
      },
      {
        match: (path) => path.startsWith('/detail') || path.startsWith('/video'),
        selectors: {
          play: "[aria-label='Play']",
          pause: "[aria-label='Pause']",
          seek: "[data-testid='seek-bar']",
        },
      },
    ],
  },
  'youtube.com': {
    zones: [
      {
        match: (path) => path === '/' || path === '',
        selectors: {
          search_input: 'input#search',
          search_button: 'button#search-icon-legacy',
        },
      },
      {
        match: (path) => path.startsWith('/results'),
        selectors: {
          first_result: 'ytd-video-renderer:first-child #video-title',
          all_results: 'ytd-video-renderer #video-title',
        },
      },
      {
        match: (path) => path.startsWith('/watch'),
        selectors: {
          play_pause: 'button.ytp-play-button',
          fullscreen: 'button.ytp-fullscreen-button',
          volume: 'div.ytp-volume-panel',
        },
      },
    ],
  },
  'netflix.com': {
    zones: [
      {
        match: (path) => path.startsWith('/browse'),
        selectors: {
          search_box_launcher: "[data-uia='search-box-launcher']",
          search_input: "[data-uia='search-box-input']",
        },
      },
      {
        match: (path) => path.startsWith('/search'),
        selectors: {
          first_result: '.title-card-container:first-child .slider-refocus',
        },
      },
      {
        match: (path) => path.startsWith('/watch'),
        selectors: {
          play_pause: "[data-uia='control-play-pause']",
          volume: "[data-uia='control-volume-high']",
        },
      },
    ],
  },
};

export function getSelectors(url: string): ZoneSelectors {
  try {
    const { hostname, pathname } = new URL(url);
    const domain = hostname.replace(/^www\./, '');
    const site = selectorMap[domain];
    if (!site) return {};

    const zone = site.zones.find((z) => z.match(pathname));
    return zone?.selectors ?? {};
  } catch {
    return {};
  }
}
