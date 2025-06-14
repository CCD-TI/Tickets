import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  async ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;
    const mail = queryParams['mail'];
    const dni = queryParams['dni'];

    if (mail && dni) {
      localStorage.setItem('userEmail', mail);
      localStorage.setItem('userDNI', dni);
      await this.authService.loginwithEmail(mail, dni);
      await this.authService.redirectBasedOnRole(true);
      return;
    }

    const sessionResponse = await this.authService.getSession();
    if (sessionResponse?.data?.session) {
      console.log('Sesión activa detectada');
      
      console.log("estado actual: ", this.authService.userState());
      await this.authService.redirectBasedOnRole();
    }
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }

  logout() {
    this.authService.logout();
  }
}