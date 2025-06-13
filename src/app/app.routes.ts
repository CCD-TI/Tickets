import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { PanelUserComponent } from './pages/panel-user/panel-user.component';
import { PanelWorkerComponent } from './pages/panel-worker/panel-worker.component';
import { PanelAdminComponent } from './pages/panel-admin/panel-admin.component';
import { NewTicketComponent } from './pages/new-ticket/new-ticket.component';
import { authGuard } from './guards/auth.guard';

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
    data: { role: ['admin'] }
  },
  {
    path: 'new-ticket',
    component: NewTicketComponent,
    canActivate: [authGuard],
    data: { role: ['user', 'trabajador'] }
  },
  { path: '**', redirectTo: 'login' }
];