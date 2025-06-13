import { Component, effect, input, output, signal } from '@angular/core';
import { Ticket } from '../../models/tickets';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { DropdownModule } from 'primeng/dropdown';
import { TicketsService } from '../../services/tickets.service';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { UserState } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, TagModule, ButtonModule, DropdownModule, AvatarModule, DialogModule],
  templateUrl: './ticket-card.component.html',
  styleUrl: './ticket-card.component.css'
})
export class TicketCardComponent {
  ticket = input<Ticket>();
  ticketFilter = input<'my' | 'area' | 'quejas'>('area');
  statusBadge = input<{ label: string; class: string }>();
  priorityBadge = input<{ label: string; class: string }>();
  user = input<UserState | null>();
  cardClicked = output<void>();
  showResponsesModal = signal(false);
  showActionsDropdown = signal(false);
  showPriority = signal(false);
  showStatus = signal(false);
  responseMessage = '';
  showResponseForm = signal(false);

  priorityOptions = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' }
  ];

  statusOptions = [
    { label: 'Pendiente', value: 'open' },
    { label: 'En Progreso', value: 'in_progress' },
    { label: 'Resuelto', value: 'closed' }
  ];

  constructor(
    private ticketsService: TicketsService,
    private messageService: MessageService
  ) { }

  onCardClick() {
    this.cardClicked.emit();
  }

  async updatePriority(event: any) {
    if (!this.ticket()) return;
    try {
      await this.ticketsService.updatePriority(this.ticket()?.id || '', event.target.value);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Prioridad actualizada correctamente'
      });
      this.showActionsDropdown.set(false);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar la prioridad'
      });
    }
  }

  async updateStatus(event: any) {
    if (!this.ticket()) return;
    try {
      await this.ticketsService.updateStatus(this.ticket()?.id || '', event.target.value);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Estado actualizado correctamente'
      });
      this.showActionsDropdown.set(false);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado'
      });
    }
  }

  canRespond(): boolean {
    // Solo trabajadores pueden responder a tickets de su área
    return this.user()?.role === 'trabajador' &&
      this.ticket()?.status === 'in_progress';
  }

  async submitResponse() {
    if (!this.ticket()?.id || !this.responseMessage.trim()) return;

    try {
      await this.ticketsService.addTicketResponse(
        this.ticket()!.id,
        this.responseMessage
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Respuesta enviada correctamente'
      });

      this.showResponseForm.set(false);
      this.responseMessage = '';

    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo enviar la respuesta'
      });
    }
  }

}