import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PanelUserComponent } from './pages/panel-user/panel-user.component';
import { PanelWorkerComponent } from './pages/panel-worker/panel-worker.component';
import { PanelAdminComponent } from './pages/panel-admin/panel-admin.component';
import { NewTicketComponent } from './pages/new-ticket/new-ticket.component';
import { authGuard } from './guards/auth.guard';
import { PanelTicketsComponent } from './pages/panel-admin/panel-tickets/panel-tickets.component';
import { PanelUsersComponent } from './pages/panel-admin/panel-users/panel-users.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'panel-user',
    component: PanelUserComponent,
    canActivate: [authGuard],
    data: { role: ['user'] }
  },
  {
    path: 'panel-worker',
    component: PanelWorkerComponent,
    canActivate: [authGuard],
    data: { role: ['trabajador'] }
  },
  {
    path: 'panel-admin',
    component: PanelAdminComponent,
    canActivate: [authGuard],
    data: { role: ['admin'] },
    children: [
      { path: '', redirectTo: 'tickets', pathMatch: 'full' },
      { path: 'tickets', component: PanelTicketsComponent },
      { path: 'users', component: PanelUsersComponent },
    ]
  },
  {
    path: 'new-ticket',
    component: NewTicketComponent,
    canActivate: [authGuard],
    data: { role: ['user', 'trabajador', 'admin'] }
  },
  { path: '**', redirectTo: 'login' }
];