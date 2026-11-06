const $ = (id) => document.getElementById(id);
const player = $('player');
const video = player.querySelector('video');
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function mediaURL(path) {
  if (!path) return '';
  try {
    const url = new URL(path, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function openWork(work) {
  $('video-title').textContent = work.title;
  $('video-desc').textContent = work.description || '';
  $('video-error').hidden = true;
  $('video-link').href = mediaURL(work.video);
  video.poster = mediaURL(work.cover);
  video.src = mediaURL(work.video);
  player.showModal();
  video.play().catch(() => {});
}
$('close').onclick = () => player.close();
player.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
});
video.addEventListener('error', () => {
  if (player.open) $('video-error').hidden = false;
});
$('share').onclick = async () => {
  const url = new URL(location.pathname, location.origin).href;
  try { await navigator.clipboard.writeText(url); $('status').textContent = '链接已复制'; }
  catch { $('status').textContent = url; }
};
async function render() {
  const response = await fetch('content.json', {cache:'no-cache'});
  if (!response.ok) throw new Error('无法载入内容');
  const data = await response.json();
  if (data.name && !data.name.startsWith('［')) {
    $('editor-name').textContent = data.name;
    document.title = data.name + ' · 视频设计师作品集';
  }
  $('avatar').textContent = Array.from(data.name || '剪')[0];
  const avatarURL = mediaURL(data.avatar);
  if (avatarURL) {
    const portrait = node('img');
    portrait.alt = data.name + '的头像';
    portrait.addEventListener('load', () => {
      $('avatar').replaceChildren(portrait);
      $('avatar').removeAttribute('aria-hidden');
    }, {once: true});
    portrait.src = avatarURL;
  }
  if (data.birthDate) {
    $('birth-date').textContent = '出生日期 ' + data.birthDate.replaceAll('-', '.');
    $('birth-date').hidden = false;
  }
  $('bio').textContent = data.bio;
  $('skills').replaceChildren(...data.skills.map(skill => node('span', skill)));
  for (const job of data.experience) {
    const item = node('article', '', 'job');
    const details = node('div', '', 'job-details');
    details.append(node('h3', job.title));
    if (job.role) details.append(node('p', job.role, 'job-role'));
    if (job.description) details.append(node('p', job.description, 'muted'));
    if (job.period) item.append(node('p', job.period, 'job-period'));
    item.append(details);
    $('experience').append(item);
  }
  if (data.email) {
    const link = node('a', data.email);
    link.href = 'mailto:' + data.email;
    $('contacts').append(link);
  }
  if (data.wechat) $('contacts').append(node('p', '微信 ' + data.wechat));
  if (data.phone) {
    const phone = node('p', '联系电话 ');
    const link = node('a', data.phone);
    link.href = 'tel:' + data.phone;
    phone.append(link);
    $('contacts').append(phone);
    $('profile-contact').append(phone.cloneNode(true));
  }
  const qrURL = mediaURL(data.wechatQr);
  if (qrURL) {
    const figure = node('figure', '', 'wechat-qr');
    const qr = node('img');
    qr.src = qrURL;
    qr.alt = data.name + '的微信二维码';
    figure.append(qr, node('figcaption', '微信扫码添加'));
    $('contacts').append(figure);
  }
  if (!data.email && !data.wechat && !data.phone && !qrURL) $('contacts').append(node('p', '［待填写邮箱或微信］', 'muted'));
  const groups = [null, ...new Set(data.works.map(work => work.category))];
  function show(group) {
    for (const [index, button] of Array.from($('filters').children).entries()) {
      button.setAttribute('aria-pressed', String(groups[index] === group));
    }
    const works = data.works.filter(work => group === null || work.category === group);
    $('work-count').textContent = works.length + ' 部作品';
    $('grid').replaceChildren();
    if (!works.length) $('grid').append(node('p', '作品即将更新', 'muted'));
    for (const work of works) {
      const card = node('button', '', 'card');
      card.type = 'button';
      const thumb = node('div', '', 'thumb');
      const cover = mediaURL(work.cover);
      if (cover) {
        const img = node('img');
        img.src = cover;
        img.alt = '';
        img.loading = 'lazy';
        thumb.append(img);
      }
      const play = node('span', '▶', 'play');
      play.setAttribute('aria-hidden', 'true');
      thumb.append(play);
      const info = node('div', '', 'card-info');
      info.append(node('b', work.title), node('small', work.category + (work.demo ? ' · 演示样片' : '')));
      card.append(thumb, info);
      card.onclick = () => openWork(work);
      $('grid').append(card);
    }
  }
  for (const group of groups) {
    const button = node('button', group ?? '全部');
    button.type = 'button';
    button.onclick = () => show(group);
    $('filters').append(button);
  }
  show(null);
}
render().catch(() => { $('grid').textContent = '作品集内容暂时无法载入。'; });
