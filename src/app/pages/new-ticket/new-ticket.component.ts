import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { TicketsService } from '../../services/tickets.service';
import { AuthService, UserState } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { CreateTicket, Ticket } from '../../models/tickets';
import { CardModule } from 'primeng/card';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment.development';
import { ElementRef } from '@angular/core';
import { UploadResponse, UploadService } from '../../services/upload.service';
import { Observable } from 'rxjs';
import { ApiResponse, FileModel, Folder } from '../../models/upload';
import { areaOptions, priorityOptions, proyectoOptions, statusOptions, tipoProblemaOptions } from '../../utils/data';

@Component({
  selector: 'app-new-ticket',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    FileUploadModule,
    ImageModule,
    TagModule
  ],
  templateUrl: './new-ticket.component.html',
  styleUrl: './new-ticket.component.css',
  providers: [MessageService]
})
export class NewTicketComponent implements OnInit {
  authService = inject(AuthService);
  ticketsService = inject(TicketsService);
  messageService = inject(MessageService);
  router = inject(Router);
  uploadService = inject(UploadService);

  ticket: Partial<CreateTicket> = {
    nombre_usuario: '',
    asunto: '',
    descripcion: '',
    priority: '',
    area_destino: 0,
    proyecto_id: 0,
    tipo_problema_id: 0,
  };
  user: UserState | null = null;
  uploadedFiles: { url: string, key: string }[] = [];
  isUploading = false;
  @ViewChild('fileInput') fileInput!: ElementRef;
  area = areaOptions;
  proyecto = proyectoOptions;
  tipoProblema = tipoProblemaOptions;
  prioridad = priorityOptions;
  estado = statusOptions;

  ngOnInit() {
    this.user = this.authService.userState();
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    
    const dniGuardado = localStorage.getItem('userDNI');
    if (dniGuardado) {
      this.ticket.dni = dniGuardado;
      setTimeout(() => {
        this.onDniChange(dniGuardado);
      }, 0);
    }

    // Configuración según rol
    if (this.user.role === 'user') {
      this.ticket.priority = 'low';
      this.ticket.area_destino = 1; // Área académica
      this.ticket.proyecto_id = 10; // Tipo de problema académico
      const storedDNI = localStorage.getItem('userDNI');
      if (storedDNI) {
        this.ticket.dni = storedDNI;
      }
      const nombre = localStorage.getItem('userNombre')
      if(nombre){
        this.ticket.nombre_usuario = nombre;
      }
    }

    if (this.user.role === 'trabajador') {
      this.ticket.priority = 'low';
      this.ticket.area_origen = this.user.area_id; // Área académica
    }

    // this.loadDropdownOptions();
  }

  get showPriorityField(): boolean {
    return this.user?.role !== 'user' && this.user?.role !== 'trabajador';
  }

  get showAreaDestinoField(): boolean {
    return this.user?.role !== 'user';
  }

  get showAreaOrigenField(): boolean {
    return this.user?.role === 'user';
  }

  get showProjectField(): boolean {
    return this.user?.role !== 'user';
  }

  // async loadDropdownOptions() {
  //   try {
  //     this.areas = areas?.map(area => ({ label: area.nombre, value: area.id })) || [];

  //     const proyectos = await this.ticketsService.getProyectos();
  //     this.proyectos = proyectos?.map(proyecto => ({ label: proyecto.nombre, value: proyecto.id })) || [];

  //     const tiposProblema = await this.ticketsService.getTiposProblema();
  //     this.tiposProblema = tiposProblema?.map(tipo => ({ label: tipo.nombre, value: tipo.id })) || [];
  //   } catch (error: any) {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Error',
  //       detail: 'No se pudieron cargar las opciones del formulario.'
  //     });
  //   }
  // }

  async onFileSelect(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    this.isUploading = true;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          this.messageService.add({
            severity: 'warn',
            summary: 'Archivo muy grande',
            detail: 'El archivo excede el límite de 10MB'
          });
          continue;
        }
        await this.uploadImage(file);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al subir las imágenes'
      });
    } finally {
      this.isUploading = false;
      // Reset the input to allow selecting the same file again if needed
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  async uploadImage(file: File) {
    const response = await this.uploadService.uploadImage(file).subscribe((response: { files: { url: string }[] }) => {
      this.uploadedFiles.push({ url: response.files[0].url, key: response.files[0].url });
    });

    if (!response) {
      throw new Error('Error al subir la imagen');
    }

  }

  // async onUpload(event: any) {
  //   this.isUploading = true;
  //   const files = event.files;

  //   try {
  //     for (const file of files) {
  //       const formData = new FormData();
  //       formData.append('image', file);

  //       // Puedes permitir al usuario seleccionar una carpeta o usar una por defecto
  //       formData.append('folderPath', 'Ticket-CCD');

  //       const response = await fetch(environment.supabaseUrl + '/functions/v1/upload-image', {
  //         method: 'POST',
  //         body: formData
  //       });

  //       if (!response.ok) {
  //         throw new Error('Error al subir la imagen');
  //       }

  //       const result = await response.json();
  //       this.uploadedFiles.push({ url: result.url, key: result.key });
  //     }

  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'Éxito',
  //       detail: 'Imágenes subidas correctamente'
  //     });
  //   } catch (error: any) {
  //     this.messageService.add({
  //       severity: 'error',
  //       summary: 'Error',
  //       detail: error.message || 'Error al subir las imágenes'
  //     });
  //   } finally {
  //     this.isUploading = false;
  //     // Limpiar los archivos seleccionados después de subirlos
  //     event.clear();
  //   }
  // }

  removeImage(index: number) {
    this.uploadedFiles.splice(index, 1);
    // Opcional: También podrías llamar a tu edge function para eliminar el archivo de R2
  }

  // Actualiza el método submitTicket para corregir el error
  async submitTicket() {
    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, completa todos los campos requeridos.'
      });
      return;
    }

    try {
      const newTicket: CreateTicket = {
        user_id: this.user!.user_id,
        nombre_usuario: this.ticket.nombre_usuario!,
        dni: this.ticket.dni!,
        asunto: this.ticket.asunto!,
        descripcion: this.ticket.descripcion!,
        priority: this.ticket.priority!,
        tipo_problema_id: this.ticket.tipo_problema_id!,
        image_urls: this.uploadedFiles.length > 0 ? this.uploadedFiles.map(f => f.url) : undefined
      };

      // Solo para usuarios normales
      if (this.user?.role === 'user') {
        newTicket.area_origen = this.user.area_id;
        newTicket.area_destino = 1; // Área académica por defecto
        newTicket.proyecto_id = 10; // Proyecto académico por defecto
      }

      // Solo para trabajadores
      if (this.user?.role === 'trabajador' || this.user?.role === 'admin') {
        newTicket.area_origen = this.user.area_id;
        newTicket.area_destino = this.ticket.area_destino!;
        newTicket.proyecto_id = this.ticket.proyecto_id!;
      }

      await this.ticketsService.createTicket(newTicket);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Ticket creado correctamente.'
      });
      this.router.navigate([this.user?.role === 'user' ? '/panel-user' : '/panel-worker']);
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'No se pudo crear el ticket.'
      });
    }
  }

  isFormValid(): boolean {
    return !!(
      this.ticket.asunto &&
      this.ticket.descripcion &&
      this.ticket.priority &&
      this.ticket.area_destino &&
      this.ticket.tipo_problema_id &&
      (this.user?.role === 'user' ? this.ticket.dni : true)
    );
  }

  cancel() {
    this.router.navigate(['/panel-user']);
  }

  onDniChange(dni: string) {
    if (/^\d{8}$/.test(dni)) {
      const dnicurrent = localStorage.getItem('userDNI');
      if(dnicurrent && dni == dnicurrent){
        return;
      }
      this.buscarNombrePorDni(dni);
      localStorage.setItem('userDNI', dni);
      
    } else {
      this.ticket.nombre_usuario = ''; // Limpia si el DNI no es válido
    }
  }

  async buscarNombrePorDni(dni: string) {
    try {
      const response = await fetch('https://datospersonas.erpccd.com/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numdni: dni })
      });

      const data = await response.json();

      if (data.estado === 'ok' && data.dataJson?.persona?.preNombres) {
        this.ticket.nombre_usuario = data.dataJson.persona.preNombres;
        localStorage.setItem('userNombre', data.dataJson.persona.preNombres)
      } else {
        this.ticket.nombre_usuario = '';
        this.messageService.add({
          severity: 'warn',
          summary: 'No encontrado',
          detail: 'No se encontró información para el DNI ingresado.'
        });
      }
    } catch (error) {
      console.error('Error al buscar el nombre por DNI', error);
      this.ticket.nombre_usuario = '';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo consultar el DNI.'
      });
    }
  }

}