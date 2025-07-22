// Mock data based on actual Spotify API structure
export const mockTopArtists = [
  {
    id: "06HL4z0CvFAxyc27GXpf02",
    name: "Taylor Swift",
    popularity: 100,
    images: [
      {
        height: 640,
        url: "https://i.scdn.co/image/ab6761610000e5ebe672b5f553298dcdccb0e676",
        width: 640
      }
    ],
    external_urls: {
      spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02"
    },
    genres: ["pop", "country pop"]
  },
  {
    id: "1dfeR4HaWDbWqFHLkxsg1d",
    name: "Queen",
    popularity: 87,
    images: [
      {
        height: 640,
        url: "https://i.scdn.co/image/ab6761610000e5eb40b5c07ab77b6b1a9075fdc0",
        width: 640
      }
    ],
    external_urls: {
      spotify: "https://open.spotify.com/artist/1dfeR4HaWDbWqFHLkxsg1d"
    },
    genres: ["classic rock", "glam rock"]
  },
  {
    id: "4q3ewBCX7sLwd24euuV69X",
    name: "Bad Bunny",
    popularity: 95,
    images: [
      {
        height: 640,
        url: "https://i.scdn.co/image/ab6761610000e5eb7b25c3e5b68d0b8e3b1c9f45",
        width: 640
      }
    ],
    external_urls: {
      spotify: "https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X"
    },
    genres: ["reggaeton", "latin trap"]
  },
  {
    id: "6fOMl44jA4Sp5b9PpYCkzz",
    name: "NF",
    popularity: 82,
    images: [
      {
        height: 640,
        url: "https://i.scdn.co/image/ab6761610000e5eb3c9d4c9e4c5f9c8b2a1d5e6f",
        width: 640
      }
    ],
    external_urls: {
      spotify: "https://open.spotify.com/artist/6fOMl44jA4Sp5b9PpYCkzz"
    },
    genres: ["hip hop", "rap"]
  },
  {
    id: "7dGJo4pcD2V6oG8kP0tJRR",
    name: "Eminem",
    popularity: 89,
    images: [
      {
        height: 640,
        url: "https://i.scdn.co/image/ab6761610000e5eb626c9d2e0ac1b4c5e8e4d0b8",
        width: 640
      }
    ],
    external_urls: {
      spotify: "https://open.spotify.com/artist/7dGJo4pcD2V6oG8kP0tJRR"
    },
    genres: ["detroit hip hop", "hip hop"]
  },
  {
    id: "0YC192cP3KPCRWx8zr8MfZ",
    name: "Harry Styles",
    popularity: 88,
    images: [
      {
        height: 640,
        url: "https://i.scdn.co/image/ab6761610000e5eb3e8c1e0c4c5f9c8b2a1d5e6f",
        width: 640
      }
    ],
    external_urls: {
      spotify: "https://open.spotify.com/artist/0YC192cP3KPCRWx8zr8MfZ"
    },
    genres: ["pop", "british pop"]
  }
];

export const mockTopTracks = [
  {
    id: "1BxfuPKGuaTgP7aM0Bbdwr",
    name: "Cruel Summer",
    artist_name: "Taylor Swift",
    release_date: "2019-08-23",
    image: "https://i.scdn.co/image/ab67616d0000b273e787dc3d64b94d3ddf0c3e6f",
    external_url: "https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr",
    preview_url: "/Taylor Swift - Cruel Summer (Official Audio)_30s.mp3",
    popularity: 95,
    rank: 1
  },
  {
    id: "4VqPOruhp5EdPBeR92t6lQ",
    name: "Unholy (feat. Kim Petras)",
    artist_name: "Sam Smith",
    release_date: "2022-09-22",
    image: "https://i.scdn.co/image/ab67616d0000b273906c7f4f4c5f9c8b2a1d5e6f",
    external_url: "https://open.spotify.com/track/4VqPOruhp5EdPBeR92t6lQ",
    preview_url: "/Sam Smith, Kim Petras - Unholy (Official Music Video)_30s.mp3",
    popularity: 92,
    rank: 2
  },
  {
    id: "0VjIjW4GlUOl9g8J6wQfWZ",
    name: "As It Was",
    artist_name: "Harry Styles",
    release_date: "2022-04-01",
    image: "https://i.scdn.co/image/ab67616d0000b273de4fb7c8ac0b3e6f3e1c0e5f",
    external_url: "https://open.spotify.com/track/0VjIjW4GlUOl9g8J6wQfWZ",
    preview_url: "/Harry Styles - As It Was (Official Video)_30s.mp3",
    popularity: 90,
    rank: 3
  },
  {
    id: "3n3Ppam7vgaVa1iaRUc9Lp",
    name: "Mr. Brightside",
    artist_name: "The Killers",
    release_date: "2003-09-29",
    image: "https://i.scdn.co/image/ab67616d0000b273ac0b3e6f3e1c0e5f8a7b9c2d",
    external_url: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp",
    preview_url: "/The Killers - Mr. Brightside (Official Music Video)_30s.mp3",
    popularity: 88,
    rank: 4
  },
  {
    id: "0tgVpDi06FyKpA1z0VMD4v",
    name: "Another Love",
    artist_name: "Tom Odell",
    release_date: "2012-10-01",
    image: "https://i.scdn.co/image/ab67616d0000b2738b2a1d5e6f7c9d4e5a6b8c9f",
    external_url: "https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v",
    preview_url: "/Tom Odell - Another Love (Official Video)_30s.mp3",
    popularity: 86,
    rank: 5
  },
  {
    id: "4LRPiXqCikLlN15c3yImP7",
    name: "Anti-Hero",
    artist_name: "Taylor Swift",
    release_date: "2022-10-21",
    image: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5",
    external_url: "https://open.spotify.com/track/4LRPiXqCikLlN15c3yImP7",
    preview_url: "/Taylor Swift - Anti-Hero (Official Music Video)_30s.mp3",
    popularity: 94,
    rank: 6
  }
];

export const mockTopGenres = [
  { name: "Pop", percentage: 28, color: "#1DB954" },
  { name: "Hip Hop", percentage: 22, color: "#1ED760" },
  { name: "Rock", percentage: 18, color: "#FF6B35" },
  { name: "Electronic", percentage: 12, color: "#FFE66D" },
  { name: "R&B", percentage: 10, color: "#FF006E" },
  { name: "Country", percentage: 6, color: "#8338EC" },
  { name: "Jazz", percentage: 4, color: "#3A86FF" }
];