import { Product, Review } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'ganesha-sculpture-01',
    name: 'Lord Ganesha Wooden Sculpture',
    category: 'God Sculptures',
    priceINR: 45000,
    priceUSD: 540,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeK7OKa4S77fALp3MU5L9NH0gUHmQRzi-AW2uYLfAXuAa5d4auqSgKarq3yGCCRHPRh2lTGGtxUpYVYBcstbF9c4Nz8wUfq8UmEnNWncE-TduzzQcuUe8rc-pz4enVZ6xzav7mXuTtxd5PILaLNETSmFJ0u-kZVfQ63qtPkKmMo42ciLE4DZydgHp3MYiQBBuzMNU5i-PygNcb3217pT3GOrWYmtFilyN9wYaEE48AAg5WMCOiIKzmeg',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBeK7OKa4S77fALp3MU5L9NH0gUHmQRzi-AW2uYLfAXuAa5d4auqSgKarq3yGCCRHPRh2lTGGtxUpYVYBcstbF9c4Nz8wUfq8UmEnNWncE-TduzzQcuUe8rc-pz4enVZ6xzav7mXuTtxd5PILaLNETSmFJ0u-kZVfQ63qtPkKmMo42ciLE4DZydgHp3MYiQBBuzMNU5i-PygNcb3217pT3GOrWYmtFilyN9wYaEE48AAg5WMCOiIKzmeg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCa4Z9K5l4YQ6XcDffw3e5SngOLJkgd5yPNil2skW0a16LI5_DdNFq4iLr0kZnwGvBqDIgBsvvnRxySTo93JWk3VBvFYGvJIIScc6LhOOuP4lYzlPTnxEUAj1qvyltmE8PvCblGbJI5kDhtUXIoidVUB5RUobLit31WeoiS7E0_vyOooz5cgb_fd6eVsDs3A3_kcQQldVOsYwag12KWT_4cO6hhsUKvLj1oiwV-WbIkRplsJKIdKCfKEw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAaoYYIHLqAYTr-pcMpz8gC0cKOhdNmKaUljAMAs1VaEw-ZZZm5eBvU0bUuiOZ_xOya1vZfs6pRWZmPqobBB1JngyytxZ7TdvzQU5N0nD2TjXcuwQ-aj9Pc5HmHbOcRCUk4xQLkZOJ67vxJDEBBvzVQmCmpQNkP0BTN3cqt43i3h1YvMVgFPWfyMa5uxUTz21cU3M1Rm20sv2VnNLL_q-CYV2k5kQtuoG_V3vaaTj-VYk1nQbzzl249Bw',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAFT8tFhda3R43bsOtAtoKT-xQOVxIOeu5xSps8cko6_K66eK1ptV7I7FxSsRp2VxIYS_t5oVwpZV9cNK5xjMIc1kG5S17sxI-jM2reR2j71qDhEH2pD5fkrKLgJA7aHqjPPZdyft3JLeGJFXxYMtCILNC2K2F0ZoIi1HzJQNkU6eF5_wN38tPCDO7htKYL6NX5vC1ZoyO73k5OGO9Fmjx6pUcgdBLmxVr9ikxvN7dj9TTQjDwl3Npi4g'
    ],
    description: 'A timeless tribute to divinity, this Lord Ganesha sculpture is meticulously hand-carved by master artisans following traditional Hoysala and Chola art styles. Each piece carries the soul of the wood and the dedication of the sculptor, making it a unique spiritual centerpiece for your home.',
    shortDescription: 'Temple-grade hand-carved Ganesha idol in aged rosewood with intricate floral and divine crown work.',
    dimensions: '18" H x 12" W x 8" D',
    material: 'Premium Rosewood',
    style: 'Classic Temple',
    authenticity: 'Artisan Signed & Certified',
    isBestSeller: true,
    isNewArrival: true,
    timberOptions: ['Premium Rosewood', 'Aged Teak Wood', 'Red Sandalwood'],
    weight: '14.5 kg',
    rating: 4.9,
    reviewCount: 38,
    featuredInSpotlight: true
  },
  {
    id: 'ananthasayana-vishnu-02',
    name: 'Ananthasayana Vishnu',
    category: 'Wall Mounts',
    priceINR: 350000,
    priceUSD: 4200,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBS1ELlckSMDlqJ1YXaEkUx7yAMpnOUG0wSOgFPuBit9lC4XD9DBl1Q8BG3LvLRbB9hzZuuRKJgW_2u05do-W3VljhE2jtNEk7rqW5mphJw6SybKHl3RLE5kyodeV56ff9bNGaMzMI4Ch_lkBuA20zWlbdM7TfsLP4fQ6Maf6SGNj58O2Ph2TMzHuHDf_XAH7dKIhcmdpEtBfjehjHf6LuIjEhlRkre8aZY7KL7KmcZ3Vh9ADlmq5HzIQ',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBS1ELlckSMDlqJ1YXaEkUx7yAMpnOUG0wSOgFPuBit9lC4XD9DBl1Q8BG3LvLRbB9hzZuuRKJgW_2u05do-W3VljhE2jtNEk7rqW5mphJw6SybKHl3RLE5kyodeV56ff9bNGaMzMI4Ch_lkBuA20zWlbdM7TfsLP4fQ6Maf6SGNj58O2Ph2TMzHuHDf_XAH7dKIhcmdpEtBfjehjHf6LuIjEhlRkre8aZY7KL7KmcZ3Vh9ADlmq5HzIQ'
    ],
    description: 'A masterwork of sacred iconography depicting Lord Vishnu reclining upon the cosmic serpent Adishesha. Carved from a single monolith of seasoned Burmese teak with hand-engraved ornamental archways.',
    shortDescription: 'Monolithic carved teak wall panel depicting Lord Vishnu resting on Adishesha.',
    dimensions: '36" H x 24" W x 4" D',
    material: 'Aged Teak Wood',
    style: 'Dravidian Temple Motif',
    authenticity: 'Artisan Signed & Certified',
    isNewArrival: true,
    timberOptions: ['Aged Teak Wood', 'Red Sandalwood'],
    weight: '22 kg',
    rating: 5.0,
    reviewCount: 14,
    featuredInSpotlight: true
  },
  {
    id: 'mandala-square-panel-03',
    name: 'Mandala Square Panel',
    category: 'Square Panels',
    priceINR: 237500,
    priceUSD: 2850,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaen1JgbPQ50iJvvmonLoEqTq-cTEs-yICskF4AzzNWCGrb2yJfec-2LLhfWgW-ZRdfvM9P2GwBnjP4ac0TxfDLa-ycEl-ZjH2HS860tJdeT9Hsd8N4V40ahyrDcxyJfGQUlZ3l3AGAbBf6nIW-AKRlX8ezJxWGvPWnbGiyPgOXMieXuNXWgVIS97KMzp4pd9PcSymqyhVmSBrihU7UXhY_fB-JXEbhye14jGRyezYmoMGbajeIF0huA',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBaen1JgbPQ50iJvvmonLoEqTq-cTEs-yICskF4AzzNWCGrb2yJfec-2LLhfWgW-ZRdfvM9P2GwBnjP4ac0TxfDLa-ycEl-ZjH2HS860tJdeT9Hsd8N4V40ahyrDcxyJfGQUlZ3l3AGAbBf6nIW-AKRlX8ezJxWGvPWnbGiyPgOXMieXuNXWgVIS97KMzp4pd9PcSymqyhVmSBrihU7UXhY_fB-JXEbhye14jGRyezYmoMGbajeIF0huA'
    ],
    description: 'Intricate 3D multi-layered carved lotus mandala square panel representing cosmic harmony. Perfect statement focal point for minimalist living rooms, entry foyers, or modern puja rooms.',
    shortDescription: 'Layered geometric lotus mandala panel in natural honey teak.',
    dimensions: '30" H x 30" W x 3" D',
    material: 'Honey-Stained Teak',
    style: 'Architectural Sacred Geometry',
    authenticity: 'Artisan Signed',
    isBestSeller: true,
    timberOptions: ['Honey-Stained Teak', 'Dark Walnut'],
    weight: '16.8 kg',
    rating: 4.8,
    reviewCount: 22,
    featuredInSpotlight: true
  },
  {
    id: 'the-royal-peacock-04',
    name: 'The Royal Peacock',
    category: 'Grand Sculptures',
    priceINR: 1000000,
    priceUSD: 12000,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_YuhgcG5heo6xKcyUpgaAeJASCdnVZP0kln-_gUwqWfNMlxPopZMoftXy6mswafTasS6mi-jCx_9m-RlP9OEQHWeEbMsi9sV4ShHVk4JPv8uWXdONoKXIX-36VH66IXGug3ZE_7nqL1kOluNB9T0pqhYi2ijwKI_KniaIe_Bi1kZBnsjl_3P1oP677NIuZyBsB85KteVKDTc5h_pVBAabEWGgHt_3jvdgfPZy7nKA6uOEWmEPazYM7w',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA_YuhgcG5heo6xKcyUpgaAeJASCdnVZP0kln-_gUwqWfNMlxPopZMoftXy6mswafTasS6mi-jCx_9m-RlP9OEQHWeEbMsi9sV4ShHVk4JPv8uWXdONoKXIX-36VH66IXGug3ZE_7nqL1kOluNB9T0pqhYi2ijwKI_KniaIe_Bi1kZBnsjl_3P1oP677NIuZyBsB85KteVKDTc5h_pVBAabEWGgHt_3jvdgfPZy7nKA6uOEWmEPazYM7w'
    ],
    description: 'A grand life-sized royal peacock sculpture sculpted from solid rosewood. Every individual feather plume is carved with paper-thin precision, celebrating the emblem of royalty and grace.',
    shortDescription: 'Limited Edition 1-of-1 life-sized rosewood peacock sculpture.',
    dimensions: '42" H x 28" W x 16" D',
    material: 'Solid Indian Rosewood',
    style: 'Royal Court Artistry',
    authenticity: 'Numbered Limited Edition (1 of 3)',
    isLimitedEdition: true,
    timberOptions: ['Solid Indian Rosewood'],
    weight: '38 kg',
    rating: 5.0,
    reviewCount: 8,
    featuredInSpotlight: true
  },
  {
    id: 'flowing-form-iii-05',
    name: 'Flowing Form III',
    category: 'Wall Mounts',
    priceINR: 283000,
    priceUSD: 3400,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAFRkdOaQU4PHApGgQbo_FJRUjh1MWNQbeVUOa8g25g4gGXpzYkjcrLVV0NykvQULzI9wUoTnbhcTMzjwK3pH91RxnlfZhy63kwiJEJni-4LQZ-9k31P5aPfvagrzdNUBtxnm-XKqTToXMfYS5Cj-kT8a5q8M4o47IkDCqCDHERKbjuhLd0linMoTLJJCDotqMNol3iSK-sJnWWCwPWGL70TEZdU9k3iRqszpyCTM0CR9QHZwUvwNIOg',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAAFRkdOaQU4PHApGgQbo_FJRUjh1MWNQbeVUOa8g25g4gGXpzYkjcrLVV0NykvQULzI9wUoTnbhcTMzjwK3pH91RxnlfZhy63kwiJEJni-4LQZ-9k31P5aPfvagrzdNUBtxnm-XKqTToXMfYS5Cj-kT8a5q8M4o47IkDCqCDHERKbjuhLd0linMoTLJJCDotqMNol3iSK-sJnWWCwPWGL70TEZdU9k3iRqszpyCTM0CR9QHZwUvwNIOg'
    ],
    description: 'Contemporary organic wall wave sculpture combining traditional hand-sanding with modern architectural fluid contours. Carved from dark sandalwood.',
    shortDescription: 'Fluid organic dark sandalwood sculpture for luxury interiors.',
    dimensions: '48" L x 14" H x 6" D',
    material: 'Dark Sandalwood',
    style: 'Modern Organic Minimalist',
    authenticity: 'Artisan Signed',
    timberOptions: ['Dark Sandalwood', 'Burnt Walnut'],
    weight: '12 kg',
    rating: 4.7,
    reviewCount: 19,
    featuredInSpotlight: true
  },
  {
    id: 'heritage-triptych-06',
    name: 'Heritage Triptych',
    category: 'Square Panels',
    priceINR: 425000,
    priceUSD: 5100,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmALo1Snt4ZAeuLAwz94vm83laWqK2Jh-zDKqq2g6Wv2kvToPHycHkEtafvRKtcgB0F7c5QMdM7ltZqmLA2MWnTiNlkwCX5wc0CsGPLDdOI3RSAAFuW-3SZmQMehLWHCcbU8huLonlGQ-XgJMq3riiW4FR35otXB2noePwRyg5QiWsiYn7rE_xmZxcc1wCAvuSsXlNscHOUEMOlhu4q7HZ9LbeeZhA1AzB6Lugm_ZdhPavrwZypRmmFg',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAmALo1Snt4ZAeuLAwz94vm83laWqK2Jh-zDKqq2g6Wv2kvToPHycHkEtafvRKtcgB0F7c5QMdM7ltZqmLA2MWnTiNlkwCX5wc0CsGPLDdOI3RSAAFuW-3SZmQMehLWHCcbU8huLonlGQ-XgJMq3riiW4FR35otXB2noePwRyg5QiWsiYn7rE_xmZxcc1wCAvuSsXlNscHOUEMOlhu4q7HZ9LbeeZhA1AzB6Lugm_ZdhPavrwZypRmmFg'
    ],
    description: 'Set of three vertical temple wall panels featuring Lord Ganesha, Goddess Lakshmi, and Goddess Saraswati amidst hand-carved floral vines.',
    shortDescription: 'Three-panel vertical carved teak triptych featuring divine triads.',
    dimensions: '40" H x 12" W x 2.5" D (Each Panel)',
    material: 'Honey Teak',
    style: 'Heritage Temple Relief',
    authenticity: 'Artisan Signed',
    timberOptions: ['Honey Teak', 'Dark Rosewood'],
    weight: '28 kg (Set)',
    rating: 4.9,
    reviewCount: 16,
    featuredInSpotlight: true
  },
  {
    id: 'serene-guardian-07',
    name: 'Serene Guardian',
    category: 'God Sculptures',
    priceINR: 558000,
    priceUSD: 6700,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvAh_HDZxUVqrNmvou5-GTkt-YWbuelLymfZboXq0tR9d3R8VUCNwi9Uji0KycPp1F5RN35XPfKuU--zFBephLhcebbmIkZvcCHGDebrm17wt3ehf6QLASxzLvwGKT4swsRs41PuhoHavy3T4GlP-fZFxbXkFCXHvGSadUAeELRljr6dy10AkHQ8-0fAECiEYMcrVfN8DlDS_BDijlQDppZnJ04RlIzZq-lGY8qOs2WJaCroxEgKF5aA',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvAh_HDZxUVqrNmvou5-GTkt-YWbuelLymfZboXq0tR9d3R8VUCNwi9Uji0KycPp1F5RN35XPfKuU--zFBephLhcebbmIkZvcCHGDebrm17wt3ehf6QLASxzLvwGKT4swsRs41PuhoHavy3T4GlP-fZFxbXkFCXHvGSadUAeELRljr6dy10AkHQ8-0fAECiEYMcrVfN8DlDS_BDijlQDppZnJ04RlIzZq-lGY8qOs2WJaCroxEgKF5aA'
    ],
    description: 'Monastic ancient dvarapala temple guardian idol carved in matte aged wood. Exudes tranquility, dignity, and spiritual protection.',
    shortDescription: 'Matte aged wood temple guardian idol with subtle hand patina.',
    dimensions: '28" H x 14" W x 10" D',
    material: 'Aged Teak Wood',
    style: 'Ancient Monastic Sculpture',
    authenticity: 'Artisan Signed',
    isNewArrival: true,
    timberOptions: ['Aged Teak Wood'],
    weight: '19 kg',
    rating: 4.9,
    reviewCount: 11,
    featuredInSpotlight: true
  },
  {
    id: 'reclaimed-mirror-08',
    name: 'Reclaimed Teak Mirror',
    category: 'Mirrors & Decor',
    priceINR: 15000,
    priceUSD: 180,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIgGCxp4B150RZuOBOvvpS5cDE7N8QQfqgu214gjsavOv31zK6lGzJ42uVfwg35id3gnIwDkN8lMHvTY1ywwUhwSsu93qmWHArveoDkAySvj3ExwShhqMdt8ZWfYoEID8NGnuyiaqywUhSGFI_6Awu3goDiNE96rdFdnW-uWFtYTp-ZR4z2S94JQ3MD-yr1yBeitJgh9aKfX-dhtL9-2hVYAQFJdo7yf5eZAJGQb1cSANoTQaV4A1wEg',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCIgGCxp4B150RZuOBOvvpS5cDE7N8QQfqgu214gjsavOv31zK6lGzJ42uVfwg35id3gnIwDkN8lMHvTY1ywwUhwSsu93qmWHArveoDkAySvj3ExwShhqMdt8ZWfYoEID8NGnuyiaqywUhSGFI_6Awu3goDiNE96rdFdnW-uWFtYTp-ZR4z2S94JQ3MD-yr1yBeitJgh9aKfX-dhtL9-2hVYAQFJdo7yf5eZAJGQb1cSANoTQaV4A1wEg'
    ],
    description: 'Hand-turned circular mirror frame made from reclaimed 80-year-old teak wood beams. Polished with organic beeswax to showcase natural grain variation.',
    shortDescription: 'Round mirror frame in hand-waxed reclaimed teak.',
    dimensions: '24" Diameter x 2" Deep',
    material: 'Reclaimed Teak Wood',
    style: 'Artisanal Organic',
    authenticity: 'Hand-carved Stamp',
    isBestSeller: true,
    timberOptions: ['Reclaimed Teak Wood'],
    weight: '6.5 kg',
    rating: 4.8,
    reviewCount: 45,
    featuredInSpotlight: true
  },
  {
    id: 'amber-vase-bottles-09',
    name: 'Amber Vase Glass & Wood Set',
    category: 'Baskets & Bottles',
    priceINR: 6250,
    priceUSD: 75,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt5afwGubDnUJrNAajxEA1VX91CYFawQtMjIGretBTwTpvo7uyiAERbJCJwrhCjdAar8XpX8PPfg-Ims7Q8IlBFtdQ37r8eyCVBL0Za6HoavknNwN5G5ErfzhDb4cD8mSRQjaRuU8P2jwtXEZK9YhOOnUsGq0jPSlcZe73C4zZyIzB_412A98byqrABACGkVLo1B93589es-L1Txrhsa6tCTDLkpg-5TqexWrHEWSCoZBNcMOO-e8Zyg',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDt5afwGubDnUJrNAajxEA1VX91CYFawQtMjIGretBTwTpvo7uyiAERbJCJwrhCjdAar8XpX8PPfg-Ims7Q8IlBFtdQ37r8eyCVBL0Za6HoavknNwN5G5ErfzhDb4cD8mSRQjaRuU8P2jwtXEZK9YhOOnUsGq0jPSlcZe73C4zZyIzB_412A98byqrABACGkVLo1B93589es-L1Txrhsa6tCTDLkpg-5TqexWrHEWSCoZBNcMOO-e8Zyg'
    ],
    description: 'Trio of hand-blown amber apothecary bottles mounted on a solid carved dark teak base with dried botanical arrangements.',
    shortDescription: 'Set of 3 apothecary bottles with handcrafted wood tray.',
    dimensions: '14" L x 5" W x 9" H',
    material: 'Recycled Glass & Dark Teak',
    style: 'Botanical Sanctuary Decor',
    authenticity: 'Artisan Crafted',
    timberOptions: ['Dark Teak'],
    weight: '2.8 kg',
    rating: 4.9,
    reviewCount: 52,
    featuredInSpotlight: true
  },
  {
    id: 'eco-woven-baskets-10',
    name: 'Eco Woven Baskets (Set of 3)',
    category: 'Baskets & Bottles',
    priceINR: 3250,
    priceUSD: 39,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjq-np3h8g3iH9nmcGvhXEdpX07dewumjdiYE5xkumW7vaRAuj-1jZD-64DJdDxb58FHbHTAsUcrK1-Ir9oidUgS1scoxgRbEElJjSsWn2lRuhphSxkuIgTCIsIMnjA889OEvO5YSTJfLIi23ZdFIMHo3DN5FVcn5da1Z3fk3-YeHw_OGJ2niQCOU7uU27_sppotioAF0QaPifyCOJdaFybsPJcAllcDeLQYbVUh9N3j4vq4XkW-8QOA',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCjq-np3h8g3iH9nmcGvhXEdpX07dewumjdiYE5xkumW7vaRAuj-1jZD-64DJdDxb58FHbHTAsUcrK1-Ir9oidUgS1scoxgRbEElJjSsWn2lRuhphSxkuIgTCIsIMnjA889OEvO5YSTJfLIi23ZdFIMHo3DN5FVcn5da1Z3fk3-YeHw_OGJ2niQCOU7uU27_sppotioAF0QaPifyCOJdaFybsPJcAllcDeLQYbVUh9N3j4vq4XkW-8QOA'
    ],
    description: 'Fair-trade hand-woven palm fiber and grass baskets designed for wall art mounting or organic tabletop storage.',
    shortDescription: 'Sustainable woven wall & storage baskets from partner artisans.',
    dimensions: '16", 12", and 8" Diameters',
    material: 'Natural Palm Fiber & Sea Grass',
    style: 'Global Artisanal Woven',
    authenticity: 'Fair Trade Certified',
    timberOptions: ['Natural Palm Fiber'],
    weight: '1.2 kg',
    rating: 4.7,
    reviewCount: 64,
    featuredInSpotlight: true
  },
  {
    id: 'temple-mandapam-shrine-11',
    name: 'Sacred Temple Mandapam Shrine',
    category: 'Custom Commissions',
    priceINR: 850000,
    priceUSD: 10200,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCopiZFKKw0hGQPYG_mLJdJ5OB7pOHQxsc3Z1QMibWen6WwhVBTKcCX8q6DR76oTyFF2Ya7jXDFMdIHUWPvL0KHHsQ98AdTlT59EjnWnqwWqqYHrJDWISDmnviw_egcQEkqqmzjpjPgubHoVVY7mySXhS-McHYfNe0WiLyTw7jKsBOMWUdNItg8AjA76PraiU4VURKLncMTXH1mbmJ369jGX9-62e8B7aI0rbQE4dSxe-Zv2Uczn_gmeA',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCopiZFKKw0hGQPYG_mLJdJ5OB7pOHQxsc3Z1QMibWen6WwhVBTKcCX8q6DR76oTyFF2Ya7jXDFMdIHUWPvL0KHHsQ98AdTlT59EjnWnqwWqqYHrJDWISDmnviw_egcQEkqqmzjpjPgubHoVVY7mySXhS-McHYfNe0WiLyTw7jKsBOMWUdNItg8AjA76PraiU4VURKLncMTXH1mbmJ369jGX9-62e8B7aI0rbQE4dSxe-Zv2Uczn_gmeA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6UfA30eH85zizQJcBtetHE5i6YbPGXO6TpyvBDfnmyCmhEVQLqJFqTMb_GQa0qNbfJ6eik1HTmjEqonVFkezDmdh7z1-N9mJXi4SHPOk7J9ZOlppZ0I4rCBypPSyeYG_nsmD7ZQ-tG7QFo-B5bMK_U5GxXJcMU9uVUB_MClXKWEghPNjp_aE75v5tYeTBhugtLxxDmQeFVGU9L1hqUcTLZu_JtDkqPHPBra0XuT0DckQ1f8eFi-6Bsw'
    ],
    description: 'Our flagship wooden home temple shrine pays homage to the grand temples of Hampi and Madurai. Features hand-carved pillars, dome Gopuram, pulling drawers, LED backlit lattice, and solid brass hardware.',
    shortDescription: 'Grand teak wooden home temple Mandapam with intricate carved pillars.',
    dimensions: '60" H x 36" W x 22" D',
    material: '100% Sustainable Teak Wood',
    style: 'Hoysala Architectural Mandir',
    authenticity: 'Master Carver Certified',
    isNewArrival: true,
    timberOptions: ['Aged Teak Wood', 'Rosewood Premium', 'Sandalwood Inlay'],
    weight: '65 kg',
    rating: 5.0,
    reviewCount: 9,
    featuredInSpotlight: false
  },
  {
    id: 'carved-temple-doors-12',
    name: 'Royal Heritage Temple Doors (Pair)',
    category: 'Temple Doors',
    priceINR: 650000,
    priceUSD: 7800,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2XtT6-Jf7cOMrIJrgV88untrXYs-djj1NK10Z4tbGAt9KElbKfTNeSXxMfbpYv5Cj9roR0FYMH9fC5f0y32uJIZMr9EAUiEqIzm1h2sm4dadaCxGWlCy7y_ytIJ6ZuMvxodktvaO4ODIzSl1NnLywxGvjui0TY2Kj6tDzdlSN5HDMBqdZHLYOYgXJcCzY12qkSNw7-QjpTNERtHWUeM_MIUwWYCf-oG8SnZBazYozK1VoYB6NRPE_ZA',
    galleryImages: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA2XtT6-Jf7cOMrIJrgV88untrXYs-djj1NK10Z4tbGAt9KElbKfTNeSXxMfbpYv5Cj9roR0FYMH9fC5f0y32uJIZMr9EAUiEqIzm1h2sm4dadaCxGWlCy7y_ytIJ6ZuMvxodktvaO4ODIzSl1NnLywxGvjui0TY2Kj6tDzdlSN5HDMBqdZHLYOYgXJcCzY12qkSNw7-QjpTNERtHWUeM_MIUwWYCf-oG8SnZBazYozK1VoYB6NRPE_ZA'
    ],
    description: 'Double entry temple doors carved with 108 Ashtalakshmi floral motifs and brass bell studs. Custom engineered to fit luxury residence entrances or private temple room entrances.',
    shortDescription: 'Pair of carved double temple doors with brass bell inserts.',
    dimensions: '84" H x 42" W x 3.5" D (Pair)',
    material: 'Aged Teak & Cast Brass',
    style: 'Royal South Indian Temple',
    authenticity: 'Artisan Signed & Custom Sized',
    timberOptions: ['Aged Teak Wood', 'Rosewood Premium'],
    weight: '85 kg',
    rating: 5.0,
    reviewCount: 7,
    featuredInSpotlight: false
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'ganesha-sculpture-01',
    userName: 'Rajesh & Vidya Sharma',
    userLocation: 'Bengaluru, India',
    rating: 5,
    comment: 'The craftsmanship on this Lord Ganesha idol is divine. The rosewood grain and natural hand-polished sheen bring such serenity to our living room sanctuary. Delivered in a safe wooden crate.',
    date: 'July 14, 2026',
    verifiedPurchase: true
  },
  {
    id: 'rev-2',
    productId: 'ganesha-sculpture-01',
    userName: 'Dr. Anita Roy',
    userLocation: 'London, UK',
    rating: 5,
    comment: 'Ordered for our newly built home in London. The authenticity certificate and master carver signature add immense value. Irisjev Wooden Crafts is truly world-class.',
    date: 'June 28, 2026',
    verifiedPurchase: true
  },
  {
    id: 'rev-3',
    productId: 'mandala-square-panel-03',
    userName: 'Vikram Merchant',
    userLocation: 'Mumbai, India',
    rating: 5,
    comment: 'Exquisite 3D depth! Everyone who visits our apartment asks about this carved mandala panel. Packaged meticulously with easy wall hanging brackets.',
    date: 'May 19, 2026',
    verifiedPurchase: true
  }
];
