import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);

  async ngOnInit() {
    const { data: { session } } = await this.authService.getSession();
    if (session) {
      await this.authService.redirectBasedOnRole(); // Redirige según el rol
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle().then(() => {
      this.authService.redirectBasedOnRole(); // Redirige tras login exitoso
    });
  }

  logout() {
    this.authService.logout();
  }
}
