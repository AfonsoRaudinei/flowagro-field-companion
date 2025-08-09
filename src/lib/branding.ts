export const setAppName = (name: string) => {
  try {
    document.title = name;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', name);
  } catch (_) {}
};

export const setFavicon = (href: string) => {
  try {
    let link: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  } catch (_) {}
};

export const applyBranding = (options: { appName?: string; faviconUrl?: string; }) => {
  if (options.appName) setAppName(options.appName);
  if (options.faviconUrl) setFavicon(options.faviconUrl);
};
