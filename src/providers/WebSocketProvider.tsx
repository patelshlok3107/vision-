'use client';
import React, { createContext, useContext } from 'react';

type Ctx = { isConnected: boolean };

const Ctx = createContext<Ctx>({ isConnected: false });

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={{ isConnected: false }}>{children}</Ctx.Provider>;
}
export function useWebSocket() { return useContext(Ctx); }
export function useNotifications() { return { notifications: [], unreadCount: 0, markRead: ()=>{}, markAllRead: ()=>{}, remove: ()=>{}, socket: null, isConnected: false }; }
