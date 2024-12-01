// export type Contact = {
//   name: string
//   icon: string
//   link: string
//   href: string
// }

export const getContactObject = (Link: {
  facebook: string
  messenger: string
  instagram: string
  youtube: string
  mail: string
  github: string
  twitter: string
  discord: string
}) => ({
  facebook: {
    name: 'facebook',
    link: 'https://www.facebook.com/' + Link.facebook,
    href: 'https://www.facebook.com/' + Link.facebook,
  },
  messenger: {
    name: 'messenger',
    link: 'https://m.me/' + Link.messenger,
    href: 'https://m.me/' + Link.messenger,
  },
  instagram: {
    name: 'instagram',
    link: 'https://www.instagram.com/' + Link.instagram,
    href: 'https://www.instagram.com/' + Link.instagram,
  },
  youtube: {
    name: 'youtube',
    link: 'https://www.youtube.com/' + Link.youtube,
    href: 'https://www.youtube.com/' + Link.youtube,
  },
  mail: {
    name: 'mail',
    link: 'mailto:' + Link.mail,
    href: 'mailto:' + Link.mail,
  },
  github: {
    name: 'github',
    link: 'https://github.com/' + Link.github,
    href: 'https://github.com/' + Link.github,
  },
  twitter: {
    name: 'twitter',
    link: 'https://twitter.com/' + Link.twitter,
    href: 'https://twitter.com/' + Link.twitter,
  },
  discord: {
    name: 'discord',
    link: 'https://discord.gg/' + Link.discord,
    href: 'https://discord.gg/' + Link.discord,
  },
})
