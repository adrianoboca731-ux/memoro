import { create } from 'zustand';

export type ViewType = 'explore' | 'albums' | 'favorites' | 'recent' | 'search' | 'groups' | 'galleries' | 'messages' | 'notifications';

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
  albumId: string | null;
  views: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  album: Album | null;
  comments: Comment[];
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  createdAt: string;
  updatedAt: string;
  photos?: Photo[];
  photoCount?: number;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  photos?: GroupPhoto[];
}

export interface GroupMember {
  id: string;
  groupId: string;
  username: string;
  role: string;
  joinedAt: string;
}

export interface GroupPhoto {
  id: string;
  groupId: string;
  photoId: string;
  addedBy: string;
  addedAt: string;
  photo: Photo;
}

export interface Gallery {
  id: string;
  name: string;
  description: string | null;
  cover: string | null;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
  items?: GalleryItem[];
}

export interface GalleryItem {
  id: string;
  galleryId: string;
  photoId: string;
  note: string | null;
  addedBy: string;
  addedAt: string;
  photo: Photo;
}

export interface Message {
  id: string;
  fromUser: string;
  toUser: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  // Navigation
  currentView: ViewType;
  selectedPhotoId: string | null;
  selectedAlbumId: string | null;
  selectedGroupId: string | null;
  selectedGalleryId: string | null;
  isUploadOpen: boolean;
  searchQuery: string;

  // Data
  photos: Photo[];
  albums: Album[];
  groups: Group[];
  galleries: Gallery[];
  messages: Message[];
  notifications: Notification[];
  stats: { totalPhotos: number; totalAlbums: number; totalViews: number };

  // Loading states
  isLoadingPhotos: boolean;
  isLoadingAlbums: boolean;
  isLoadingGroups: boolean;
  isLoadingGalleries: boolean;

  // Notification badge
  unreadNotifications: number;
  unreadMessages: number;

  // Actions - Navigation
  setCurrentView: (view: ViewType) => void;
  selectPhoto: (id: string | null) => void;
  selectAlbum: (id: string | null) => void;
  selectGroup: (id: string | null) => void;
  selectGallery: (id: string | null) => void;
  toggleUpload: () => void;
  setSearchQuery: (query: string) => void;

  // Actions - Photos
  setPhotos: (photos: Photo[]) => void;
  setAlbums: (albums: Album[]) => void;
  setStats: (stats: { totalPhotos: number; totalAlbums: number; totalViews: number }) => void;
  toggleFavorite: (id: string) => void;
  deletePhoto: (id: string) => void;
  addPhoto: (photo: Photo) => void;
  updatePhoto: (id: string, data: Partial<Photo>) => void;
  addAlbum: (album: Album) => void;
  deleteAlbum: (id: string) => void;
  setLoadingPhotos: (loading: boolean) => void;
  setLoadingAlbums: (loading: boolean) => void;
  addComment: (photoId: string, comment: Comment) => void;

  // Actions - Groups
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  setLoadingGroups: (loading: boolean) => void;

  // Actions - Galleries
  setGalleries: (galleries: Gallery[]) => void;
  addGallery: (gallery: Gallery) => void;
  deleteGallery: (id: string) => void;
  setLoadingGalleries: (loading: boolean) => void;

  // Actions - Messages
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (id: string) => void;
  markMessageRead: (id: string) => void;

  // Actions - Notifications
  setNotifications: (notifications: Notification[]) => void;
  setUnreadNotifications: (count: number) => void;
  setUnreadMessages: (count: number) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Notification) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'explore',
  selectedPhotoId: null,
  selectedAlbumId: null,
  selectedGroupId: null,
  selectedGalleryId: null,
  isUploadOpen: false,
  searchQuery: '',

  // Data
  photos: [],
  albums: [],
  groups: [],
  galleries: [],
  messages: [],
  notifications: [],
  stats: { totalPhotos: 0, totalAlbums: 0, totalViews: 0 },

  // Loading
  isLoadingPhotos: false,
  isLoadingAlbums: false,
  isLoadingGroups: false,
  isLoadingGalleries: false,

  // Badges
  unreadNotifications: 0,
  unreadMessages: 0,

  // Actions - Navigation
  setCurrentView: (view) => set({ currentView: view }),
  selectPhoto: (id) => set({ selectedPhotoId: id }),
  selectAlbum: (id) => set({ selectedAlbumId: id, currentView: id ? 'albums' : 'albums' }),
  selectGroup: (id) => set({ selectedGroupId: id, currentView: 'groups' }),
  selectGallery: (id) => set({ selectedGalleryId: id, currentView: 'galleries' }),
  toggleUpload: () => set((state) => ({ isUploadOpen: !state.isUploadOpen })),
  setSearchQuery: (query) => set({ searchQuery: query, currentView: query ? 'search' : 'explore' }),

  // Actions - Photos
  setPhotos: (photos) => set({ photos }),
  setAlbums: (albums) => set({ albums }),
  setStats: (stats) => set({ stats }),
  toggleFavorite: (id) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p
      ),
    })),
  deletePhoto: (id) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      selectedPhotoId: state.selectedPhotoId === id ? null : state.selectedPhotoId,
    })),
  addPhoto: (photo) =>
    set((state) => ({ photos: [photo, ...state.photos] })),
  updatePhoto: (id, data) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  addAlbum: (album) =>
    set((state) => ({ albums: [album, ...state.albums] })),
  deleteAlbum: (id) =>
    set((state) => ({
      albums: state.albums.filter((a) => a.id !== id),
      photos: state.photos.map((p) =>
        p.albumId === id ? { ...p, albumId: null, album: null } : p
      ),
      selectedAlbumId: state.selectedAlbumId === id ? null : state.selectedAlbumId,
    })),
  setLoadingPhotos: (loading) => set({ isLoadingPhotos: loading }),
  setLoadingAlbums: (loading) => set({ isLoadingAlbums: loading }),
  addComment: (photoId, comment) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === photoId
          ? { ...p, comments: [comment, ...(p.comments || [])] }
          : p
      ),
    })),

  // Actions - Groups
  setGroups: (groups) => set({ groups }),
  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),
  deleteGroup: (id) =>
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== id),
      selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
    })),
  setLoadingGroups: (loading) => set({ isLoadingGroups: loading }),

  // Actions - Galleries
  setGalleries: (galleries) => set({ galleries }),
  addGallery: (gallery) =>
    set((state) => ({ galleries: [gallery, ...state.galleries] })),
  deleteGallery: (id) =>
    set((state) => ({
      galleries: state.galleries.filter((g) => g.id !== id),
      selectedGalleryId: state.selectedGalleryId === id ? null : state.selectedGalleryId,
    })),
  setLoadingGalleries: (loading) => set({ isLoadingGalleries: loading }),

  // Actions - Messages
  setMessages: (messages) => set({
    messages,
    unreadMessages: messages.filter((m) => !m.isRead).length,
  }),
  addMessage: (message) =>
    set((state) => ({ messages: [message, ...state.messages] })),
  deleteMessage: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
  markMessageRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) => m.id === id ? { ...m, isRead: true } : m),
      unreadMessages: Math.max(0, state.unreadMessages - 1),
    })),

  // Actions - Notifications
  setNotifications: (notifications) => set({ notifications }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  setUnreadMessages: (count) => set({ unreadMessages: count }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      unreadNotifications: Math.max(0, state.unreadNotifications - 1),
    })),
  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadNotifications: 0,
    })),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadNotifications: state.unreadNotifications + 1,
    })),
}));
