import { h, render } from '../utils/dom.js';
import { mailtoHref, telHref } from '../utils/url.js';

export function renderFooter(root, restaurant) {
  const { name, tagline, address, phone, email, openingHours, socialLinks, logo } = restaurant;
  const phoneHref = telHref(phone);
  const emailHref = mailtoHref(email);
  const hasContact = address || phone || email;

  render(root,
    h('div', { class: 'site-footer__inner' },
      h('div', { class: 'site-footer__brand' },
        logo && h('img', {
          class: 'site-footer__logo', src: logo, alt: '', width: 56, height: 56, loading: 'lazy',
          onError: (event) => event.currentTarget.remove(),
        }),
        h('p', { class: 'site-footer__name' }, name),
        tagline && h('p', { class: 'site-footer__tagline' }, tagline),
      ),

      hasContact && h('section', { class: 'site-footer__block', 'aria-labelledby': 'footer-visit' },
        h('h2', { class: 'site-footer__heading', id: 'footer-visit' }, 'Visit us'),
        h('address', { class: 'site-footer__address' },
          address && h('p', {}, address),
          phone && h('p', {}, phoneHref ? h('a', { href: phoneHref }, phone) : phone),
          email && h('p', {}, emailHref ? h('a', { href: emailHref }, email) : email),
        ),
      ),

      openingHours.length > 0 && h('section', { class: 'site-footer__block', 'aria-labelledby': 'footer-hours' },
        h('h2', { class: 'site-footer__heading', id: 'footer-hours' }, 'Opening hours'),
        h('dl', { class: 'hours' },
          openingHours.map((row) => h('div', { class: 'hours__row' },
            h('dt', {}, row.days),
            h('dd', {}, row.hours),
          )),
        ),
      ),
    ),

    h('div', { class: 'site-footer__bottom' },
      h('p', {}, `© ${new Date().getFullYear()} ${name}`),
      socialLinks.length > 0 && h('ul', { class: 'site-footer__social', role: 'list' },
        socialLinks.map((link) => h('li', {},
          h('a', { href: link.url, target: '_blank', rel: 'noopener noreferrer' }, link.label),
        )),
      ),
    ),
  );
  root.hidden = false;
}
