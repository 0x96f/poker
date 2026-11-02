import { create } from 'zustand';
export const useGameStore = create((set) => ({
  gameId: '',
  currentUserId: '',
  currentUserName: '',
  users: [],
  votes: [],
  revealed: false,
  selectedVote: null,
  cardSet: null,
  setGameId: (gameId) => set({ gameId }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),
  setCurrentUserName: (currentUserName) => set({ currentUserName }),
  setUsers: (users) => set({ users }),
  setVotes: (votes) => set({ votes }),
  setRevealed: (revealed) => set({ revealed }),
  setSelectedVote: (vote) => set({ selectedVote: vote }),
  setCardSet: (cardSet) => set({ cardSet }),
}));
