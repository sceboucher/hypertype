// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Project page: https://sceboucher.github.io/hypertype
// If you ever move to a user/root page, drop `base` and the /hypertype/ asset prefixes.
export default defineConfig({
  site: 'https://sceboucher.github.io',
  base: '/hypertype',
  integrations: [
    starlight({
      title: 'hypertype',
      description:
        'Justified magazine headlines and the OpenType features CSS forgot. Zero dependencies, inline-first.',
      customCss: ['./src/styles/hypertype-theme.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/sceboucher/hypertype' },
      ],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Getting started', slug: 'getting-started' },
            { label: 'Use as a Claude skill', slug: 'skill' },
          ],
        },
        {
          label: 'Showcase',
          items: [
            { label: 'Slab playground', slug: 'playground' },
            { label: 'OpenType gallery', slug: 'opentype' },
          ],
        },
        {
          label: 'Reference',
          items: [{ label: 'API & OpenType reference', slug: 'reference' }],
        },
      ],
    }),
  ],
});
