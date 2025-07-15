var WidgetMetadata = {
  id: "av_4k",
  title: "4K AV",
  description: "获取 4k-av.com 的在线电影、电视剧资源",
  author: "你自己",
  site: "https://4k-av.com",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "电影",
      description: "获取在线电影",
      requiresWebView: false,
      functionName: "getMovies",
      params: [
        {
          name: "page",
          title: "页数",
          type: "page"
        }
      ]
    },
    {
      title: "电视剧",
      description: "获取在线电视剧",
      requiresWebView: false,
      functionName: "getTVSeries",
      params: [
        {
          name: "page",
          title: "页数",
          type: "page"
        }
      ]
    }
  ]
}

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
const BASE_URL = 'https://4k-av.com';

async function getVideos(id, page = 1) {
  const url = page > 1 ? `${BASE_URL}/${id}/page-${page}.html` : `${BASE_URL}/${id}`;
  const response = await Widget.http.get(url, {
    headers: { 'User-Agent': UA }
  });

  const $ = Widget.html.load(response.data);
  const elements = $('#MainContent_newestlist .virow .NTMitem');

  const items = elements.map((i, el) => {
    const $el = $(el);
    const href = $el.find('.title a').attr('href');
    const title = $el.find('.title h2').text().trim();
    const cover = $el.find('.poster img').attr('src');
    const subTitle = $el.find('label[title=分辨率]').text().split('/')[0];

    return {
      id: BASE_URL + href,
      type: "url",
      title: title,
      posterPath: cover,
      subtitle: subTitle,
      link: BASE_URL + href
    };
  }).get();

  return items;
}

async function getMovies(params = {}) {
  const page = params.page || 1;
  return getVideos('movie', page);
}

async function getTVSeries(params = {}) {
  const page = params.page || 1;
  return getVideos('tv', page);
}

async function loadDetail(link) {
  const response = await Widget.http.get(link, {
    headers: { 'User-Agent': UA }
  });

  const $ = Widget.html.load(response.data);
  const playlistItems = $('#rtlist li');

  if (playlistItems.length > 0) {
    const episodes = playlistItems.map((i, el) => {
      const name = $(el).find('span').text().trim();
      const thumb = $(el).find('img').attr('src');
      const playBase = thumb.replace('screenshot.jpg', '');
      return {
        id: `forward://${playBase}`,
        type: "url",
        title: name || `第${i + 1}集`,
        videoUrl: `forward://${playBase}`
      };
    }).get();

    return {
      mediaType: "tv",
      episodeItems: episodes
    };
  } else {
    const src = $('#MainContent_videowindow video source').attr('src');
    if (!src) throw new Error("未找到视频播放地址");
    return {
      mediaType: "movie",
      videoUrl: `forward://${src}`,
      type: "url"
    };
  }
}