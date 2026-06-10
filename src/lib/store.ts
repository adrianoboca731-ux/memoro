import { create } from 'zustand';

export type ViewType = 'explore' | 'albums' | 'favorites' | 'recent' | 'search';

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

interface AppState {
  // Navigation
  currentView: ViewType;
  selectedPhotoId: string | null;
  selectedAlbumId: string | null;
  isUploadOpen: boolean;
  searchQuery: string;

  // Data
  photos: Photo[];
  albums: Album[];
  stats: { totalPhotos: number; totalAlbums: number; totalViews: number };

  // Loading states
  isLoadingPhotos: boolean;
  isLoadingAlbums: boolean;

  // Actions
  setCurrentView: (view: ViewType) => void;
  selectPhoto: (id: string | null) => void;
  selectAlbum: (id: string | null) => void;
  toggleUpload: () => void;
  setSearchQuery: (query: string) => void;
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
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'explore',
  selectedPhotoId: null,
  selectedAlbumId: null,
  isUploadOpen: false,
  searchQuery: '',

  // Data
  photos: [],
  albums: [],
  stats: { totalPhotos: 0, totalAlbums: 0, totalViews: 0 },

  // Loading
  isLoadingPhotos: false,
  isLoadingAlbums: false,

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  selectPhoto: (id) => set({ selectedPhotoId: id }),
  selectAlbum: (id) => set({ selectedAlbumId: id, currentView: id ? 'albums' : 'albums' }),
  toggleUpload: () => set((state) => ({ isUploadOpen: !state.isUploadOpen })),
  setSearchQuery: (query) => set({ searchQuery: query, currentView: query ? 'search' : 'explore' }),
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
}));
