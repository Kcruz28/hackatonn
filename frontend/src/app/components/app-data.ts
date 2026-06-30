export interface Recipe {
  id: number;
  name: string;
  author: string;
  authorAvatar: string;
  cuisine: string;
  time: string;
  image: string;
  rating: number;
  tier: "S" | "A" | "B" | "C";
  notes: string;
  likes: number;
  comments: number;
  tags: string[];
  ranked: boolean;
}

export interface Friend {
  name: string;
  avatar: string;
  action: string;
  recipe: string;
  time: string;
}

export interface FriendProfile {
  name: string;
  handle: string;
  avatar: string;
  ranked: number;
  following: boolean;
  bio: string;
  recentTier: "S" | "A" | "B" | "C";
  recentRecipe: string;
  mutuals: number;
}

export interface ListItem {
  id: number;
  name: string;
  description: string;
  count: number;
  cover: string[];
  public: boolean;
  updatedAgo: string;
}

export type Screen = "landing" | "login" | "signup" | "app";

export const TIER_CONFIG = {
  S: { label: "S", bg: "bg-[#C04E28]", text: "text-[#FDF9F3]", desc: "Life-changing" },
  A: { label: "A", bg: "bg-[#D4A853]", text: "text-[#1C1814]", desc: "Would make again" },
  B: { label: "B", bg: "bg-[#8B9E84]", text: "text-[#FDF9F3]", desc: "Solid" },
  C: { label: "C", bg: "bg-[#C8BCAD]", text: "text-[#1C1814]", desc: "Decent" },
} as const;

export const RECIPES: Recipe[] = [
  {
    id: 1,
    name: "Brown Butter Ricotta Gnocchi",
    author: "Margot Villeneuve",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&auto=format",
    cuisine: "Italian",
    time: "45 min",
    image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=640&h=420&fit=crop&auto=format",
    rating: 9.4,
    tier: "S",
    notes: "The brown butter transforms this completely. Used sheep's milk ricotta and it was transcendent.",
    likes: 84,
    comments: 12,
    tags: ["pasta", "comfort food", "weekend"],
    ranked: true,
  },
  {
    id: 2,
    name: "Miso-Glazed Black Cod",
    author: "Kenji Otsuka",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format",
    cuisine: "Japanese",
    time: "2 days",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=640&h=420&fit=crop&auto=format",
    rating: 9.1,
    tier: "S",
    notes: "Marinate for the full 48 hours. Non-negotiable. The flakiness is unreal.",
    likes: 127,
    comments: 31,
    tags: ["seafood", "umami", "special occasion"],
    ranked: false,
  },
  {
    id: 3,
    name: "Sichuan Mapo Tofu",
    author: "Lin Wei",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=48&h=48&fit=crop&auto=format",
    cuisine: "Chinese",
    time: "30 min",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=640&h=420&fit=crop&auto=format",
    rating: 8.7,
    tier: "A",
    notes: "Doubled the doubanjiang. The numbing heat is addictive. Made it three times this month.",
    likes: 63,
    comments: 8,
    tags: ["spicy", "tofu", "weeknight"],
    ranked: true,
  },
  {
    id: 4,
    name: "Roasted Tomato Confit Pasta",
    author: "Elsa Hartmann",
    authorAvatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=48&h=48&fit=crop&auto=format",
    cuisine: "Italian",
    time: "1.5 hrs",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=640&h=420&fit=crop&auto=format",
    rating: 8.2,
    tier: "A",
    notes: "Summer tomatoes make or break this. Cherry tomatoes from the farmers market only.",
    likes: 49,
    comments: 6,
    tags: ["vegetarian", "summer", "pasta"],
    ranked: false,
  },
  {
    id: 5,
    name: "Lamb Kofta with Tahini",
    author: "Nadia Rashid",
    authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=48&h=48&fit=crop&auto=format",
    cuisine: "Middle Eastern",
    time: "40 min",
    image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=640&h=420&fit=crop&auto=format",
    rating: 7.8,
    tier: "B",
    notes: "Great balance of spice. The sumac yogurt sauce is underrated — make extra.",
    likes: 38,
    comments: 4,
    tags: ["lamb", "grill", "mezze"],
    ranked: true,
  },
];

export const FRIENDS: Friend[] = [
  {
    name: "Margot V.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&auto=format",
    action: "ranked",
    recipe: "Dashi Ramen",
    time: "2h ago",
  },
  {
    name: "Kenji O.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&auto=format",
    action: "added to list",
    recipe: "Boeuf Bourguignon",
    time: "5h ago",
  },
  {
    name: "Elsa H.",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=32&h=32&fit=crop&auto=format",
    action: "gave S-tier to",
    recipe: "Tonkatsu Ramen",
    time: "Yesterday",
  },
  {
    name: "Lin W.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&auto=format",
    action: "is making",
    recipe: "Peking Duck",
    time: "Yesterday",
  },
];

export const TRENDING = [
  { name: "Birria Tacos", count: 342, cuisine: "Mexican" },
  { name: "Carbonara", count: 218, cuisine: "Italian" },
  { name: "Khao Soi", count: 187, cuisine: "Thai" },
  { name: "Shakshuka", count: 164, cuisine: "Middle Eastern" },
  { name: "Dan Dan Noodles", count: 141, cuisine: "Sichuan" },
];

export const NAV_ITEMS = [
  { icon: "Flame", label: "Feed", active: true },
  { icon: "BarChart2", label: "My Rankings" },
  { icon: "List", label: "My Lists" },
  { icon: "Users", label: "Friends" },
];

export const HERO_BG = "https://images.unsplash.com/photo-1744104135578-6768f2061be1?w=1400&h=900&fit=crop&auto=format";

export const PREVIEW_CARDS = [
  {
    name: "Brown Butter Gnocchi",
    tier: "S" as const,
    rating: 9.4,
    image: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=220&h=150&fit=crop&auto=format",
    author: "Margot V.",
  },
  {
    name: "Miso-Glazed Black Cod",
    tier: "S" as const,
    rating: 9.1,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=220&h=150&fit=crop&auto=format",
    author: "Kenji O.",
  },
  {
    name: "Sichuan Mapo Tofu",
    tier: "A" as const,
    rating: 8.7,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=220&h=150&fit=crop&auto=format",
    author: "Lin W.",
  },
];

export const ALL_FRIENDS: FriendProfile[] = [
  {
    name: "Margot Villeneuve",
    handle: "@margotv",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format",
    ranked: 218,
    following: true,
    bio: "Lyon-raised, Tokyo-obsessed. I eat with a notebook.",
    recentTier: "S",
    recentRecipe: "Dashi Ramen",
    mutuals: 6,
  },
  {
    name: "Kenji Otsuka",
    handle: "@kenjio",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format",
    ranked: 304,
    following: true,
    bio: "Pescatarian. Former sushi chef. Ranking everything since 2022.",
    recentTier: "A",
    recentRecipe: "Tuna Tataki",
    mutuals: 12,
  },
  {
    name: "Elsa Hartmann",
    handle: "@elsah",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=64&h=64&fit=crop&auto=format",
    ranked: 97,
    following: false,
    bio: "Seasonal eating, farmers market devotee, terrible at desserts.",
    recentTier: "S",
    recentRecipe: "Tonkatsu Ramen",
    mutuals: 3,
  },
  {
    name: "Lin Wei",
    handle: "@linwei",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&auto=format",
    ranked: 183,
    following: true,
    bio: "Sichuan food is the only food. Will debate this.",
    recentTier: "B",
    recentRecipe: "Peking Duck",
    mutuals: 8,
  },
  {
    name: "Nadia Rashid",
    handle: "@nadiar",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=64&h=64&fit=crop&auto=format",
    ranked: 142,
    following: false,
    bio: "Middle Eastern comfort food and fine dining — no in-between.",
    recentTier: "A",
    recentRecipe: "Lamb Kofta",
    mutuals: 2,
  },
];

export const MY_LISTS: ListItem[] = [
  {
    id: 1,
    name: "Weekend Projects",
    description: "Recipes worth a full Saturday",
    count: 14,
    cover: [
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=80&h=80&fit=crop&auto=format",
    ],
    public: true,
    updatedAgo: "2 days ago",
  },
  {
    id: 2,
    name: "Weeknight Go-Tos",
    description: "Under 45 min, never boring",
    count: 22,
    cover: [
      "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=80&h=80&fit=crop&auto=format",
    ],
    public: true,
    updatedAgo: "5 days ago",
  },
  {
    id: 3,
    name: "Want to Try",
    description: "The queue",
    count: 38,
    cover: [
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=80&h=80&fit=crop&auto=format",
    ],
    public: false,
    updatedAgo: "Today",
  },
  {
    id: 4,
    name: "Special Occasion",
    description: "Worth the effort and the dishes",
    count: 9,
    cover: [
      "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=80&h=80&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=80&h=80&fit=crop&auto=format",
    ],
    public: true,
    updatedAgo: "3 weeks ago",
  },
];

export const MY_RANKINGS: (Recipe & { rankedDate: string })[] = [
  { ...RECIPES[0], rankedDate: "Jun 28, 2026" },
  { ...RECIPES[2], rankedDate: "Jun 25, 2026" },
  { ...RECIPES[4], rankedDate: "Jun 20, 2026" },
  {
    id: 6,
    name: "Beef Pho",
    author: "Kenji Otsuka",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&auto=format",
    cuisine: "Vietnamese",
    time: "4 hrs",
    image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=640&h=420&fit=crop&auto=format",
    rating: 8.9,
    tier: "A",
    notes: "The bones make or break it. Roast them first, no shortcuts.",
    likes: 54,
    comments: 7,
    tags: ["soup", "weekend", "umami"],
    ranked: true,
    rankedDate: "Jun 15, 2026",
  },
  {
    id: 7,
    name: "Mushroom Risotto",
    author: "Elsa Hartmann",
    authorAvatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=48&h=48&fit=crop&auto=format",
    cuisine: "Italian",
    time: "50 min",
    image: "https://images.unsplash.com/photo-1673442457047-dc3c3c1e3625?w=640&h=420&fit=crop&auto=format",
    rating: 7.5,
    tier: "B",
    notes: "Good but I wanted more earthiness. Dried porcini next time.",
    likes: 29,
    comments: 3,
    tags: ["vegetarian", "Italian", "comfort"],
    ranked: true,
    rankedDate: "Jun 10, 2026",
  },
  {
    id: 8,
    name: "Crispy Smashed Potatoes",
    author: "Margot Villeneuve",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop&auto=format",
    cuisine: "American",
    time: "35 min",
    image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=640&h=420&fit=crop&auto=format",
    rating: 6.8,
    tier: "C",
    notes: "Fine. I've had better. The garlic butter saved it.",
    likes: 11,
    comments: 1,
    tags: ["sides", "potato", "easy"],
    ranked: true,
    rankedDate: "Jun 5, 2026",
  },
];
