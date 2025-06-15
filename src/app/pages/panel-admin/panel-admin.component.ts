import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserState } from '../../services/auth.service';
import { TicketsService } from '../../services/tickets.service';
import { MessageService } from 'primeng/api';
import { Ticket } from '../../models/tickets';
import { computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { FormsModule } from '@angular/forms';
import { ImageModule } from 'primeng/image';
import { TicketCardComponent } from "../../components/ticket-card/ticket-card.component";
import { areaOptions, priorityOptions, proyectoOptions, statusOptions, tipoProblemaOptions } from '../../utils/data';

@Component({
  selector: 'app-panel-admin',
  imports: [CommonModule, ToastModule, FormsModule, ImageModule, TicketCardComponent],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.css'
})
export class PanelAdminComponent {
  private authService = inject(AuthService);
  public ticketsService = inject(TicketsService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private initialized = false;

  mobileMenuOpen = signal(false);
  areaUser = signal('')
  searchTerm = signal('');
  selectedTicket = signal<Ticket | null>(null);
  modalActive = signal(false);
  selectedPriority = signal<string | null>(null);
  selectedProyecto = signal<string | null>(null);
  selectedStatus = signal<string | null>(null);
  user = signal<UserState | null>(null);
  ticketFilter = signal<'my' | 'area' | 'quejas'>('area');
  showFilters = signal(false);
  responseMessage = '';
  stats = signal({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  priorityOptions = priorityOptions;
  statusOptions = statusOptions;
  tipoProblemaOptions = tipoProblemaOptions;
  proyectoOptions = proyectoOptions;
  areaOptions = areaOptions;

  filteredTickets = computed(() => {
    let tickets = this.ticketsService.tickets() || [];
    if (this.searchTerm()) {
      tickets = tickets.filter(
        ticket =>
          ticket.id.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
          ticket.asunto?.toLowerCase().includes(this.searchTerm().toLowerCase())
      );
    }
    if (this.selectedPriority()) {
      tickets = tickets.filter(ticket => ticket.priority === this.selectedPriority());
    }
    if (this.selectedStatus()) {
      tickets = tickets.filter(ticket => ticket.status === this.selectedStatus());
    }
    if (this.selectedProyecto()) {
      tickets = tickets.filter(ticket => ticket.proyecto_id === this.selectedProyecto());
    }
    return tickets;
  });

  constructor() {
    effect(async () => {
      const user = this.authService.userState();
      if (user && !this.initialized) {
        this.initialized = true;
        this.user.set(user);
        this.areaUser.set(areaOptions?.find(a => a.value === user.area_id.toString())?.label || '');
        this.loadInitialTickets();
      } else if (!user && !this.authService.isLoading()) {
        this.router.navigate(['/login']);
      }
    });

    effect(() => {
      const tickets = this.ticketsService.tickets();
      if (tickets) {
        this.stats.set({
          total: tickets.length,
          pending: tickets.filter(t => t.status === 'open').length,
          inProgress: tickets.filter(t => t.status === 'in_progress').length,
          resolved: tickets.filter(t => t.status === 'closed').length
        });
      }
    });
  }

  private async loadInitialTickets() {
    if (this.ticketFilter() === 'my') {
      await this.loadTickets();
    } else if (this.user()?.area_id) {
      await this.loadAreaTickets();
    }
  }

  setTicketFilter(filter: 'my' | 'area' | 'quejas') {
    this.ticketFilter.set(filter);
    this.selectedPriority.set(null);
    this.selectedStatus.set(null);
    this.searchTerm.set('');

    // Cargar tickets solo cuando se cambia el filtro
    if (filter === 'my') {
      this.loadTickets();
    } else if (filter === 'area') {
      this.loadAreaTickets();
    } else if (filter === 'quejas') {
      this.loadQuejasTickets();
    }
  }

  private async loadTickets() {
    try {
      const userId = this.user()?.user_id;
      if (!userId) {
        throw new Error('No se encontró el ID del usuario');
      }
      await this.ticketsService.getTicketsByUser(userId);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudieron cargar los tickets.'
      });
    }
  }

  private async loadAreaTickets() {
    try {
      await this.ticketsService.getAllTicketsArea();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudieron cargar los tickets del área.'
      });
    }
  }

  private async loadQuejasTickets() {
    try {
      await this.ticketsService.getTicketsQuejas();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudieron cargar los tickets del área.'
      });
    }
  }

  navigateToCreateTicket() {
    this.router.navigate(['/new-ticket']);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.ticketsService.clearCache();
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo cerrar sesión.'
      });
    }
  }

  openTicketDetail(ticket: Ticket) {
    this.selectedTicket.set(ticket);
    this.modalActive.set(true);
    this.markTicketAsViewed(ticket.id);
  }

  async markTicketAsViewed(ticketId: string) {
    try {
      this.ticketsService.markTicketAsViewed(ticketId);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo marcar el ticket como visto.'
      });
    }
  }

  getStatusBadge(status: string) {
    return {
      label: status === 'open' ? 'Pendiente' : status === 'in_progress' ? 'En Progreso' : 'Resuelto',
      class: `status-${status}`
    };
  }

  getPriorityBadge(priority: string) {
    return {
      label: priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : 'Alta',
      class: `priority-${priority}`
    };
  }

  filterByStat(stat: { label: string; value: number }) {
    if (stat.label === 'Pendientes') {
      this.selectedStatus.set('open');
      this.selectedPriority.set(null);
    } else if (stat.label === 'En Progreso') {
      this.selectedStatus.set('in_progress');
      this.selectedPriority.set(null);
    } else if (stat.label === 'Resueltos') {
      this.selectedStatus.set('closed');
      this.selectedPriority.set(null);
    } else {
      this.selectedStatus.set(null);
      this.selectedPriority.set(null);
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onPriorityChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedPriority.set(input.value || null);
  }

  onProyectoChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedProyecto.set(input.value || null);
  }

  onStatusChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this.selectedStatus.set(input.value || null);
  }

  canRespondToTicket(): boolean {
    const ticket = this.selectedTicket();
    const user = this.user();

    if (!ticket || !user) return false;

    // Solo trabajadores pueden responder
    if (user.role === 'user' ) return false;

    // Solo a tickets de su área
    //if (ticket.area_id?.id !== user.area_id) return false;

    // Solo si el estado es "en progreso"
    if (ticket.status !== 'in_progress') return false;

    return true;
  }

  async submitResponse(event: Event) {
    event.preventDefault();

    if (!this.selectedTicket()?.id || !this.responseMessage.trim()) return;

    try {
      await this.ticketsService.addTicketResponse(
        this.selectedTicket()!.id,
        this.responseMessage
      );

      // Actualizar el ticket localmente
      const updatedTicket = {
        ...this.selectedTicket()!,
        ticket_responses: [
          ...(this.selectedTicket()?.ticket_responses || []),
          {
            id: 'temp-' + Math.random().toString(36).substring(2),
            mensaje: this.responseMessage,
            user_id: this.user()!.user_id,
            ticket_id: this.selectedTicket()!.id,
            created_at: new Date()
          }
        ]
      };

      this.selectedTicket.set(updatedTicket);
      this.responseMessage = '';

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Respuesta enviada correctamente'
      });

    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo enviar la respuesta'
      });
    }
  }
}
