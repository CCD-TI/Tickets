import { Component, inject, effect, computed } from '@angular/core';
import { TicketsService } from '../../services/tickets.service';
import { AuthService, UserState } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../models/tickets';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TicketCardComponent } from '../../components/ticket-card/ticket-card.component';

@Component({
  selector: 'app-panel-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    CardModule,
    TagModule,
    InputTextModule,
    SelectModule,
    TicketCardComponent
  ],
  templateUrl: './panel-user.component.html',
  styleUrl: './panel-user.component.css',
  providers: [MessageService]
})
export class PanelUserComponent {
  authService = inject(AuthService);
  ticketsService = inject(TicketsService);
  messageService = inject(MessageService);
  router = inject(Router);
  mobileMenuOpen = false;
  stats = computed(() => {
    const tickets = this.filteredTickets();
    return {
      total: tickets?.length || 0,
      pending: tickets?.filter(t => t.status === 'open').length || 0,
      inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
      resolved: tickets?.filter(t => t.status === 'closed').length || 0
    };
  });
  searchTerm = '';
  selectedTicket: Ticket | null = null;
  modalActive = false;
  selectedPriority: string | null = null;
  selectedStatus: string | null = null;
  user: UserState | null = null;

  priorityOptions = [
    { label: 'Todas las prioridades', value: null },
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' }
  ];

  statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: 'open' },
    { label: 'En Progreso', value: 'in_progress' },
    { label: 'Resuelto', value: 'closed' }
  ];

  filteredTickets = computed(() => {
    let tickets = this.ticketsService.tickets() || [];
    if (this.searchTerm) {
      tickets = tickets.filter(
        ticket =>
          ticket.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          ticket.asunto?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    if (this.selectedPriority) {
      tickets = tickets.filter(ticket => ticket.priority === this.selectedPriority);
    }
    if (this.selectedStatus) {
      tickets = tickets.filter(ticket => ticket.status === this.selectedStatus);
    }
    return tickets;
  });

  constructor() {
    effect(() => {
      const user = this.authService.userState();
      const isLoading = this.authService.isLoading();

      if (isLoading) {
        console.log('PanelUser: Esperando a que AuthService cargue');
        return;
      }

      if (!user) {
        console.log('PanelUser: No hay usuario, redirigiendo a login');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Usuario no autenticado.'
        });
        this.router.navigate(['/login']);
      } else {
        console.log('PanelUser: Usuario cargado:', user);
        this.user = user;
        this.loadTickets();
      }
    });
  }

  async loadTickets() {
    try {
      console.log('PanelUser: Cargando tickets para user_id:', this.user?.user_id);
      const tickets = await this.ticketsService.getTicketsByUser(this.user!.user_id);
      this.ticketsService.tickets.set(tickets || []);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudieron cargar los tickets.'
      });
    }
  }

  navigateToCreateTicket() {
    this.router.navigate(['/new-ticket']);
  }

  async logout() {
    try {
      await this.authService.logout();
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
    this.selectedTicket = ticket;
    this.modalActive = true;
    this.markTicketAsViewed(ticket.id);
  }

  async markTicketAsViewed(ticketId: string) {
    try {
      await this.ticketsService.markTicketAsViewed(ticketId);
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
      label: status === 'pending' ? 'Pendiente' : status === 'in_progress' ? 'En Progreso' : 'Resuelto',
      class: `p-tag-${status}`
    };
  }

  getPriorityBadge(priority: string) {
    return {
      label: priority === 'low' ? 'Baja' : priority === 'medium' ? 'Media' : 'Alta',
      class: `p-tag-${priority}`
    };
  }

  async getTicketResponses(ticketId: string) {
    try {
      return await this.ticketsService.getTicketResponses(ticketId) || [];
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudieron cargar las respuestas del ticket.'
      });
      return [];
    }
  }

  filterByStat(stat: any) {
    this.selectedPriority = stat.value;
    this.selectedStatus = null;
  }
}