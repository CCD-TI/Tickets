import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

export interface UserState {
  user_id: string;
  role: string;
  area_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  userState = signal<UserState | null>(null);
  isLoading = signal<boolean>(false);

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    this.isLoading.set(true);
    await this.getCurrentUser();
    this.isLoading.set(false);

    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (event === 'SIGNED_IN') {
        this.getCurrentUser();
      } else if (event === 'SIGNED_OUT') {
        this.userState.set(null);
      }
    });
  }

  private handleError(error: any, message: string): void {
    console.error(message, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }

  async loginWithGoogle() {
    try {
      this.isLoading.set(true);
      console.log('Iniciando sesión con Google', window.location.origin);
      const { error } = await this.supabaseService.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        this.handleError(error, 'No se pudo iniciar sesión con Google');
      }
    } catch (error) {
      this.handleError(error, 'Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    try {
      this.isLoading.set(true);
      const { error } = await this.supabaseService.supabase.auth.signOut();
      if (error) {
        this.handleError(error, 'No se pudo cerrar sesión');
      }
      this.userState.set(null);
    } catch (error) {
      this.handleError(error, 'Error al cerrar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }

  async getCurrentUser(): Promise<UserState | null> {
    try {
      this.isLoading.set(true);
      const { data, error } = await this.supabaseService.supabase.auth.getUser();
      if (error) {
        console.warn('Get user error:', error.message);
        return null;
      }
      const userId = data.user?.id;
      if (!userId) {
        console.warn('No user ID found');
        return null;
      }
      return await this.getUserData(userId);
    } catch (error) {
      console.warn('Get current user failed:', error);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUserData(userId: string): Promise<UserState | null> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('user_roles')
        .select('role, area_id')
        .eq('user_id', userId)
        .single();
      if (error) {
        console.warn('Get user data error:', error.message);
        this.handleError(error, 'No se pudo obtener los datos del usuario');
        return null;
      }
      const userData: UserState = {
        user_id: userId,
        role: data.role,
        area_id: data.area_id
      };
      this.userState.set(userData);
      console.log('User state updated:', userData);
      return userData;
    } catch (error) {
      console.warn('Get user data failed:', error);
      this.handleError(error, 'No se pudo obtener los datos del usuario');
      return null;
    }
  }

  async isLoggedIn(): Promise<{ estado: boolean; rol: string | null }> {
    const user = await this.getCurrentUser();
    return {
      estado: !!user,
      rol: user ? user.role : null
    };
  }

  getSession() {
    return this.supabaseService.supabase.auth.getSession();
  }

  async redirectBasedOnRole(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    switch (user.role) {
      case 'user':
        this.router.navigate(['/panel-user']);
        break;
      case 'trabajador':
        this.router.navigate(['/panel-worker']);
        break;
      case 'admin':
        this.router.navigate(['/panel-admin']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

}