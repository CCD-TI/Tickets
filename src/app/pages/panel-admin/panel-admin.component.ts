import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService, UserState } from '../../services/auth.service';
import { TicketsService } from '../../services/tickets.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { RouterLink, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'app-panel-admin',
  imports: [CommonModule, ToastModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.css',
  providers: [MessageService]
})
export class PanelAdminComponent {
  private authService = inject(AuthService);
  public ticketsService = inject(TicketsService);
  private messageService = inject(MessageService);
  private router = inject(Router);


  mobileMenuOpen = signal(false);
  user = signal<UserState | null>(null);

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

}
