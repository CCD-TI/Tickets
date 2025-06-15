import { Injectable, signal } from '@angular/core';
import { inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AID, CreateTicket, Ticket, TicketResponse } from '../models/tickets';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private supabaseService = inject(SupabaseService);
  tickets = signal<Ticket[] | null>(null);
  ticketResponses = signal<Record<string, TicketResponse[]> | null>(null);

  private async fetchTickets(
    excludeNullAreaOrigen: boolean = false,
    filter?: { key: string; value: string }
  ): Promise<Ticket[] | null> {
    const query = this.supabaseService.supabase
      .from('tickets')
      .select(`
        *,
        tipo_problema_id (*),
        area_origen (*),
        area_destino (*),
        proyecto_id (*),
        ticket_responses (*)
      `)
      .order('created_at', { ascending: false });

    if (filter) {
      query.eq(filter.key, filter.value);
    }

    if (excludeNullAreaOrigen) {
      query.not('area_origen', 'is', null);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error fetching tickets: ${error.message}`);
    }

    const tickets = data?.map(ticket => ({
      ...ticket,
      tipo_problema_id: ticket.tipo_problema_id as AID,
      area_origen: ticket.area_origen as AID,
      area_destino: ticket.area_destino as AID,
      proyecto_id: ticket.proyecto_id as AID,
      ticket_responses: ticket.ticket_responses as TicketResponse[]
    })) || [];

    this.tickets.set(tickets);
    return tickets;
  }

  async getTickets(): Promise<Ticket[] | null> {
    if (this.tickets()) {
      return this.tickets();
    }
    return this.fetchTickets();
  }

  async getTicketsByUser(userId: string): Promise<Ticket[] | null> {
    return this.fetchTickets(false, { key: 'user_id', value: userId });
  }

  async getTicketsByArea(areaId: number): Promise<Ticket[] | null> {
    return this.fetchTickets(true, { key: 'area_destino', value: areaId.toString() });
  }

  async getTicketsByProyecto(proyectoId: number): Promise<Ticket[] | null> {
    return this.fetchTickets(false, { key: 'proyecto_id', value: proyectoId.toString() });
  }

  //Trae todos los tickets que no tengan area_origen, ya que esos son las quejas
  async getAllTicketsArea(): Promise<Ticket[] | null> {
    return this.fetchTickets(true);
  }

  async getTicketsQuejas(): Promise<Ticket[] | null> {
    const query = this.supabaseService.supabase
      .from('tickets')
      .select(`
        *,
        tipo_problema_id (*),
        area_origen (*),
        area_destino (*),
        proyecto_id (*),
        ticket_responses (*)
      `)
      .is('area_origen', null)
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    console.log(data);
    if (error) {
      throw new Error(`Error fetching quejas tickets: ${error.message}`);
    }

    const tickets = data?.map(ticket => ({
      ...ticket,
      tipo_problema_id: ticket.tipo_problema_id as AID,
      area_origen: ticket.area_origen as AID,
      area_destino: ticket.area_destino as AID,
      proyecto_id: ticket.proyecto_id as AID,
      ticket_responses: ticket.ticket_responses as TicketResponse[]
    })) || [];

    this.tickets.set(tickets);
    return tickets;
  }

  async createTicket(ticket: CreateTicket): Promise<Ticket | null> {
    const { data, error } = await this.supabaseService.supabase
      .from('tickets')
      .insert([ticket])
      .select(`
        *,
        tipo_problema_id (*),
        area_origen (*),
        area_destino (*),
        proyecto_id (*),
        ticket_responses (*)
      `)
      .single();
    if (error) {
      throw new Error(`Error creating ticket: ${error.message}`);
    }
    const newTicket = data as Ticket;
    this.tickets.update(tickets => (tickets ? [...tickets, newTicket] : [newTicket]));
    return newTicket;
  }

  async updateTicket(ticket: Ticket): Promise<Ticket | null> {
    const { data, error } = await this.supabaseService.supabase
      .from('tickets')
      .update(ticket)
      .eq('id', ticket.id)
      .select(`
        *,
        tipo_problema_id (*),
        area_origen (*),
        area_destino (*),
        proyecto_id (*),
        ticket_responses (*)
      `)
      .single();
    if (error) {
      throw new Error(`Error updating ticket: ${error.message}`);
    }
    const updatedTicket = data as Ticket;
    this.tickets.update(tickets =>
      tickets ? tickets.map(t => (t.id === updatedTicket.id ? updatedTicket : t)) : tickets
    );
    return updatedTicket;
  }

  async deleteTicket(ticket: Ticket): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('tickets')
      .delete()
      .eq('id', ticket.id);
    if (error) {
      throw new Error(`Error deleting ticket: ${error.message}`);
    }
    this.tickets.update(tickets =>
      tickets ? tickets.filter(t => t.id !== ticket.id) : tickets
    );
  }

  async getTicketResponses(ticketId: string): Promise<TicketResponse[] | null> {
    const { data, error } = await this.supabaseService.supabase
      .from('ticket_responses')
      .select('*')
      .eq('ticket_id', ticketId);
    if (error) {
      throw new Error(`Error fetching ticket responses: ${error.message}`);
    }

    this.ticketResponses.update(current => ({
      ...current,
      [ticketId]: data || []
    }));
    return data;
  }

  markTicketAsViewed(ticketId: string): void {
    this.tickets.update(tickets =>
      tickets ? tickets.map(t => (t.id === ticketId ? { ...t, hasNewResponse: false } : t)) : tickets
    );
  }

  clearCache(): void {
    this.tickets.set(null);
    this.ticketResponses.set(null);
  }

  async addTicketResponse(ticketId: string, message: string): Promise<TicketResponse | null> {
    const userId = (await this.supabaseService.supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado.');
    }
  
    const { data, error } = await this.supabaseService.supabase
      .from('ticket_responses')
      .insert([{ ticket_id: ticketId, user_id: userId, mensaje: message }])
      .select()
      .single();
  
    if (error) {
      throw new Error(`Error adding ticket response: ${error.message}`);
    }
  
    const newResponse = data as TicketResponse;
    this.ticketResponses.update(current => {
      const updated = { ...current };
      updated[ticketId] = [...(updated[ticketId] || []), newResponse];
      return updated;
    });
  
    // Update ticket to mark as having a new response for other users
    this.tickets.update(tickets =>
      tickets
        ? tickets.map(t =>
            t.id === ticketId ? { ...t, hasNewResponse: true, ticket_responses: [...(t.ticket_responses || []), newResponse] } : t
          )
        : tickets
    );
  
    return newResponse;
  }

  async updateStatus(ticketId: string, status: string): Promise<void> {
    console.log('Updating status for ticket:', ticketId, 'to:', status);
    const { data, error } = await this.supabaseService.supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) {
      throw new Error(`Error updating ticket status: ${error.message}`);
    }
    const updatedTicket = data as Ticket;
    this.tickets.update(tickets =>
      tickets ? tickets.map(t => (t.id === ticketId ? updatedTicket : t)) : tickets
    );
  }

    async updatePriority(ticketId: string, priority: string): Promise<void> {
    const { data, error } = await this.supabaseService.supabase
      .from('tickets')
      .update({ priority })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) {
      throw new Error(`Error updating ticket priority: ${error.message}`);
    }
    const updatedTicket = data as Ticket;
    this.tickets.update(tickets =>
      tickets ? tickets.map(t => (t.id === ticketId ? updatedTicket : t)) : tickets
    );
  }

  async updateAreaDestino(ticketId: string, areaDestino: string): Promise<void> {
    const { data, error } = await this.supabaseService.supabase
      .from('tickets')
      .update({ area_destino: areaDestino })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) {
      throw new Error(`Error updating ticket area_destino: ${error.message}`);
    }
    const updatedTicket = data as Ticket;
    this.tickets.update(tickets =>
      tickets ? tickets.map(t => (t.id === ticketId ? updatedTicket : t)) : tickets
    );
  }

}