import { create } from 'zustand';

export type ViewType = 'home' | 'explore' | 'albums' | 'groups' | 'galleries' | 'favorites' | 'recent' | 'search' | 'messages' | 'notifications' | 'camera-roll' | 'people';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  photoCount: number;
  followerCount: number;
  followingCount: number;
}

export interface Photo {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  filepath: string;
  thumbnail: string | null;
  mimetype: string;
  size: number;
  width: number | null;
  height: number | null;
  tags: string | null;
  views: number;
  commentCount: number;
  favoriteCount: number;
  userId: string;
  albumId: string | null;
  createdAt: string;
  updatedAt: string;
  user: User | null;
  album: Album | null;
  comments: Comment[];
  exif: Exif | null;
  isFavorited?: boolean;
}

export interface Exif {
  id: string;
  camera: string | null;
  lens: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: string | null;
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  photos?: Photo[];
  photoCount?: number;
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  photoId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  rules: string | null;
  isPublic: boolean;
  memberCount: number;
  photoCount: number;
  discussionCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: any[];
  photos?: any[];
  discussions?: any[];
}

export interface Gallery {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: any[];
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  fromUserId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  currentView: ViewType;
  selectedPhotoId: string | null;
  selectedAlbumId: string | null;
  selectedGroupId: string | null;
  selectedGalleryId: string | null;
  isUploadOpen: boolean;
  searchQuery: string;
  currentUser: User | null;
  photos: Photo[];
  albums: Album[];
  groups: Group[];
  galleries: Gallery[];
  messages: Message[];
  notifications: Notification[];
  stats: { totalPhotos: number; totalAlbums: number; totalViews: number; totalUsers: number };
  isLoadingPhotos: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  setCurrentView: (v: ViewType) => void;
  selectPhoto: (id: string | null) => void;
  selectAlbum: (id: string | null) => void;
  selectGroup: (id: string | null) => void;
  selectGallery: (id: string | null) => void;
  toggleUpload: () => void;
  setSearchQuery: (q: string) => void;
  setCurrentUser: (u: User | null) => void;
  setPhotos: (p: Photo[]) => void;
  setAlbums: (a: Album[]) => void;
  setGroups: (g: Group[]) => void;
  setGalleries: (g: Gallery[]) => void;
  setMessages: (m: Message[]) => void;
  setNotifications: (n: Notification[]) => void;
  setStats: (s: { totalPhotos: number; totalAlbums: number; totalViews: number; totalUsers: number }) => void;
  addPhoto: (p: Photo) => void;
  deletePhoto: (id: string) => void;
  updatePhoto: (id: string, d: Partial<Photo>) => void;
  addAlbum: (a: Album) => void;
  deleteAlbum: (id: string) => void;
  addGroup: (g: Group) => void;
  deleteGroup: (id: string) => void;
  addGallery: (g: Gallery) => void;
  deleteGallery: (id: string) => void;
  addComment: (photoId: string, c: Comment) => void;
  toggleFavorite: (id: string) => void;
  setUnreadNotifications: (n: number) => void;
  setUnreadMessages: (n: number) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  markMessageRead: (id: string) => void;
  addMessage: (m: Message) => void;
  deleteMessage: (id: string) => void;
  addNotification: (n: Notification) => void;
  setLoadingPhotos: (l: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'explore',
  selectedPhotoId: null, selectedAlbumId: null, selectedGroupId: null, selectedGalleryId: null,
  isUploadOpen: false, searchQuery: '', currentUser: null,
  photos: [], albums: [], groups: [], galleries: [], messages: [], notifications: [],
  stats: { totalPhotos: 0, totalAlbums: 0, totalViews: 0, totalUsers: 0 },
  isLoadingPhotos: false, unreadNotifications: 0, unreadMessages: 0,
  setCurrentView: (v) => set({ currentView: v }),
  selectPhoto: (id) => set({ selectedPhotoId: id }),
  selectAlbum: (id) => set({ selectedAlbumId: id }),
  selectGroup: (id) => set({ selectedGroupId: id }),
  selectGallery: (id) => set({ selectedGalleryId: id }),
  toggleUpload: () => set((s) => ({ isUploadOpen: !s.isUploadOpen })),
  setSearchQuery: (q) => set({ searchQuery: q, currentView: q ? 'search' : 'explore' }),
  setCurrentUser: (u) => set({ currentUser: u }),
  setPhotos: (p) => set({ photos: p }),
  setAlbums: (a) => set({ albums: a }),
  setGroups: (g) => set({ groups: g }),
  setGalleries: (g) => set({ galleries: g }),
  setMessages: (m) => set({ messages: m, unreadMessages: m.filter(x => !x.isRead).length }),
  setNotifications: (n) => set({ notifications: n }),
  setStats: (s) => set({ stats: s }),
  addPhoto: (p) => set((s) => ({ photos: [p, ...s.photos] })),
  deletePhoto: (id) => set((s) => ({ photos: s.photos.filter(p => p.id !== id), selectedPhotoId: s.selectedPhotoId === id ? null : s.selectedPhotoId })),
  updatePhoto: (id, d) => set((s) => ({ photos: s.photos.map(p => p.id === id ? { ...p, ...d } : p) })),
  addAlbum: (a) => set((s) => ({ albums: [a, ...s.albums] })),
  deleteAlbum: (id) => set((s) => ({ albums: s.albums.filter(a => a.id !== id) })),
  addGroup: (g) => set((s) => ({ groups: [g, ...s.groups] })),
  deleteGroup: (id) => set((s) => ({ groups: s.groups.filter(g => g.id !== id) })),
  addGallery: (g) => set((s) => ({ galleries: [g, ...s.galleries] })),
  deleteGallery: (id) => set((s) => ({ galleries: s.galleries.filter(g => g.id !== id) })),
  addComment: (photoId, c) => set((s) => ({ photos: s.photos.map(p => p.id === photoId ? { ...p, comments: [c, ...(p.comments || [])] } : p) })),
  toggleFavorite: (id) => set((s) => ({ photos: s.photos.map(p => p.id === id ? { ...p, isFavorited: !p.isFavorited, favoriteCount: p.favoriteCount + (p.isFavorited ? -1 : 1) } : p) })),
  setUnreadNotifications: (n) => set({ unreadNotifications: n }),
  setUnreadMessages: (n) => set({ unreadMessages: n }),
  markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n), unreadNotifications: Math.max(0, s.unreadNotifications - 1) })),
  markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map(n => ({ ...n, isRead: true })), unreadNotifications: 0 })),
  markMessageRead: (id) => set((s) => ({ messages: s.messages.map(m => m.id === id ? { ...m, isRead: true } : m), unreadMessages: Math.max(0, s.unreadMessages - 1) })),
  addMessage: (m) => set((s) => ({ messages: [m, ...s.messages] })),
  deleteMessage: (id) => set((s) => ({ messages: s.messages.filter(m => m.id !== id) })),
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications], unreadNotifications: s.unreadNotifications + 1 })),
  setLoadingPhotos: (l) => set({ isLoadingPhotos: l }),
}));
