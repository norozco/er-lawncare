// ER Lawncare: language switch, phone menu, gallery filters, quote form (sends as a text message).
const PHONE = '+17797740702';
const PHONE_SHOW = '779-774-0702';

(function () {
  const root = document.documentElement;
  // Phones and tablets can open a text message; computers get a copy option instead
  const canText = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.matchMedia('(pointer: coarse)').matches);
  root.classList.toggle('touch', canText);

  // ---------- English / Spanish (choice remembered in this browser) ----------
  function setLang(l) {
    root.dataset.lang = l; root.lang = l;
    const t = root.getAttribute(l === 'es' ? 'data-title-es' : 'data-title-en');
    if (t) document.title = t;
    document.querySelectorAll('.lang').forEach(b => {
      b.textContent = l === 'es' ? 'EN' : 'ES';
      b.setAttribute('aria-label', l === 'es' ? 'Switch to English' : 'Cambiar a español');
    });
    document.querySelectorAll('[data-ph-en]').forEach(el => el.setAttribute('placeholder', el.dataset[l === 'es' ? 'phEs' : 'phEn']));
    // Screen reader labels in the chosen language
    document.querySelectorAll('[data-alt-en]').forEach(el => { el.alt = el.dataset[l === 'es' ? 'altEs' : 'altEn']; });
    document.querySelectorAll('[data-aria-en]').forEach(el => el.setAttribute('aria-label', el.dataset[l === 'es' ? 'ariaEs' : 'ariaEn']));
  }
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  setLang(saved === 'es' ? 'es' : 'en');
  document.querySelectorAll('.lang').forEach(b => b.addEventListener('click', () => {
    const n = root.dataset.lang === 'es' ? 'en' : 'es';
    setLang(n);
    try { localStorage.setItem('lang', n); } catch (e) {}
    window.dispatchEvent(new Event('relayout'));
  }));

  // ---------- Phone menu ----------
  const header = document.querySelector('.site-header'), menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    const close = () => { header.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', () => {
      const open = !header.classList.contains('open');
      header.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', e => { if (!header.contains(e.target)) close(); });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Our Work filters ----------
  const filters = document.querySelectorAll('.filter');
  filters.forEach(f => f.addEventListener('click', () => {
    filters.forEach(x => x.setAttribute('aria-pressed', String(x === f)));
    const want = f.dataset.filter;
    document.querySelectorAll('.gallery .photo').forEach(p => { p.hidden = want !== 'all' && p.dataset.cat !== want; });
  }));

  // ---------- Quote form ----------
  // Emails the request to Eric through FormSubmit (no server needed).
  // If that fails: phones open the texting app with the request filled in, computers copy it.
  const form = document.getElementById('quote-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const copyBox = document.getElementById('copy-box');
  const btn = form.querySelector('button[type="submit"]');
  const es = () => root.dataset.lang === 'es';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const f = Object.fromEntries(new FormData(form).entries());
    if (f._honey) return; // spam bots fill the hidden field
    const opt = form.service.selectedOptions[0], service = (es() ? opt.dataset.es : opt.dataset.en) || opt.textContent.trim();
    const lines = es()
      ? [`Hola, soy ${f.name}. Quisiera una cotización.`, `Servicio: ${service}`, `Dirección: ${f.address}`, f.details ? `Detalles: ${f.details}` : '', `Mi teléfono: ${f.phone}`]
      : [`Hi, this is ${f.name}. I'd like a quote.`, `Service: ${service}`, `Address: ${f.address}`, f.details ? `Details: ${f.details}` : '', `My phone: ${f.phone}`];
    const body = lines.filter(Boolean).join('\n');
    if (window.BizBot) BizBot.track('lead', { detail: 'quote form: ' + (opt.dataset.en || service) });

    btn.disabled = true;
    status.textContent = es() ? 'Enviando...' : 'Sending...';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + form.dataset.to, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `New quote request: ${opt.dataset.en || service} (${f.name})`,
          _template: 'table',
          _captcha: 'false',
          ...(f.email ? { _replyto: f.email } : {}),
          Name: f.name, Phone: f.phone, Email: f.email || '(none)', Address: f.address,
          Service: opt.dataset.en || service, Details: f.details || '(none)',
          Language: es() ? 'Spanish' : 'English',
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || String(out.success) !== 'true') throw new Error(out.message || res.status);
      form.reset();
      copyBox.classList.remove('show');
      status.textContent = es()
        ? `¡Gracias! Recibimos su solicitud y le contactaremos pronto. ¿Tiene fotos? Mándelas por texto al ${PHONE_SHOW}.`
        : `Thanks! We got your request and will get back to you soon. Have photos? Text them to ${PHONE_SHOW}.`;
      return;
    } catch (err) {
      // fall through to texting / copying
    } finally {
      btn.disabled = false;
    }

    if (canText) {
      // "?&body=" works on both iPhone and Android
      window.location.href = `sms:${PHONE}?&body=${encodeURIComponent(body)}`;
      status.textContent = es()
        ? 'No pudimos enviarlo por correo, así que se abrió su app de mensajes con su solicitud. Agregue fotos si quiere y envíela.'
        : 'We could not send it by email, so your texting app should open with your request. Add photos if you like, then hit send.';
      return;
    }
    let copied = false;
    try { await navigator.clipboard.writeText(body); copied = true; } catch (err) { /* show it to copy by hand */ }
    copyBox.value = body;
    copyBox.classList.toggle('show', !copied);
    if (!copied) copyBox.select();
    status.textContent = copied
      ? (es() ? `No pudimos enviarlo por correo, así que lo copiamos. Péguelo en un texto al ${PHONE_SHOW} desde su teléfono, o llámenos.` : `We could not send it by email, so we copied it. Paste it into a text to ${PHONE_SHOW} from your phone, or give us a call.`)
      : (es() ? `Copie su solicitud de abajo y mándela por texto al ${PHONE_SHOW}.` : `Copy your request below and text it to ${PHONE_SHOW}.`);
  });
})();
