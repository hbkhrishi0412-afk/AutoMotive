import type { SupportTicket } from '../types';

const SUPPORT_TICKET_STORAGE_KEY = 'reRideSupportTickets';

export const getSupportTickets = (): SupportTicket[] | null => {
  try {
    const ticketsJson = localStorage.getItem(SUPPORT_TICKET_STORAGE_KEY);
    return ticketsJson ? JSON.parse(ticketsJson) : null;
  } catch (error) {
    console.error("Failed to parse support tickets from localStorage", error);
    return null;
  }
};

export const saveSupportTickets = (tickets: SupportTicket[]) => {
  try {
    localStorage.setItem(SUPPORT_TICKET_STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error("Failed to save support tickets to localStorage", error);
  }
};