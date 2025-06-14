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
    /**
     *     
    const mail = localStorage.getItem('userEmail');
    const dni = localStorage.getItem('userDNI');

    if (mail && dni) {
      this.userState.set({
        user_id: dni,
        role: 'user',
        area_id: 0
      });
      this.isLoading.set(false);
      return;
    }

     * 
     */

    const currentUser = await this.getCurrentUser();
    console.log("INICIALISADOR DE AUTH");
    console.log("current user", currentUser);
    if (currentUser) {
      this.userState.set(currentUser);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(false);

    this.supabaseService.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      if (event === 'SIGNED_OUT') {
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
        options: { redirectTo: window.location.origin }
      });
      if (error) this.handleError(error, 'No se pudo iniciar sesión con Google');
    } catch (error) {
      this.handleError(error, 'Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginwithEmail(email: string, password: string){
    try{
      this.isLoading.set(true);
      const { error } = await this.supabaseService.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "http://localhost:4200/",
        },
      })
    }catch (error) {
      this.handleError(error, 'Error al iniciar sesión');
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    try {
      this.isLoading.set(true);
      const { error } = await this.supabaseService.supabase.auth.signOut();
      if (error) this.handleError(error, 'No se pudo cerrar sesión');
      this.userState.set(null);
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userDNI');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userNombre');
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

      if(error){
        console.warn("Get user error: ", error.message);
        return null;
      }

      /*
      if (!error && data.user?.id) {
        // Guardar correo local
        const email = data.user.email || ""
        if (email) localStorage.setItem('userEmail', email);
        return await this.getUserData(data.user.id);
      }

      const mail = localStorage.getItem('userEmail');
      const dni = localStorage.getItem('userDNI');
      if (mail && dni) {
        const tempUser: UserState = {
          user_id: dni,
          role: 'user',
          area_id: 0
        };
        this.userState.set(tempUser);
        return tempUser;
      }

      this.userState.set(null);
      */ 
      if(!data.user){
        console.warn("No user ID found: ");
        return null;
      }

      return this.getUserData(data.user.id);
    } catch (error) {
      console.warn('Get current user failed:', error);
      this.userState.set(null);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getUserData(userId: string): Promise<UserState | null> {
    try {
      if(this.userState() !== null){
        return this.userState();
      }
      const { data, error } = await this.supabaseService.supabase
        .from('user_roles')
        .select('role, area_id')
        .eq('user_id', userId)
        .single();

      if (error) {
        this.handleError(error, 'No se pudo obtener los datos del usuario');
        return null;
      }

      const userData: UserState = {
        user_id: userId,
        role: data.role,
        area_id: data.area_id
      };
      
      this.userState.set(userData);
      return userData;
    } catch (error) {
      this.handleError(error, 'No se pudo obtener los datos del usuario');
      return null;
    }
  }

  async isLoggedIn(): Promise<{ estado: boolean; rol: string | null }> {
    const user = await this.getCurrentUser();
    return {
      estado: !!user,
      rol: user?.role ?? null
    };
  }

  getSession() {
    return this.supabaseService.supabase.auth.getSession();
  }

  async redirectBasedOnRole(forceUserRole = false) {
    if (forceUserRole) {
      const role = 'user';
      localStorage.setItem('userRole', role);
      await this.router.navigate(['/panel-user']);
      return;
    }
    
    const user = await this.getCurrentUser();
    if (!user) {
      console.warn('No se pudo obtener usuario para redirección');
      return;
    }

    const role = user.role;
    localStorage.setItem('userRole', role);

    switch (role) {
      case 'user':
        await this.router.navigate(['/panel-user']);
        break;
      case 'trabajador':
        await this.router.navigate(['/panel-worker']);
        break;
      case 'admin':
        await this.router.navigate(['/panel-admin']);
        break;
      default:
        await this.router.navigate(['/login']);
    }
  }
}