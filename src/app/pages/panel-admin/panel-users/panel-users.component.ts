import { Component, computed, inject, signal } from '@angular/core';
import { UsersService } from '../../../services/users.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { areaOptions, roleOptions } from '../../../utils/data';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  dni: string;
  area: string; // Changed to string to match data structure
  area_id: string;
  created_at: string;
  status: string;
}

interface Column {
  field: keyof UserData;
  header: string;
  visible: boolean;
}

@Component({
  selector: 'app-panel-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-users.component.html',
  styleUrls: ['./panel-users.component.css']
})
export class PanelUsersComponent {
  private usersService = inject(UsersService);

  // Signals for state management
  users = signal<UserData[]>([]);
  filteredUsers = computed(() => this.applyFilters());
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  totalRecords = signal<number>(0);
  rows = signal<number>(10);
  first = signal<number>(0);
  openActionsMenuId = signal<string | null>(null);
  showColumnSelector = signal<boolean>(false);
  Math = Math;
  sortField = signal<keyof UserData | null>(null);
  sortOrder = signal<1 | -1 | null>(null);
  showFilters = signal<boolean>(false);

  // Filters
  searchText = signal<string>('');
  selectedRoles = signal<string[]>([]);
  selectedAreas = signal<number[]>([]);
  roleOptions = roleOptions;
  areaOptions = areaOptions;

  // Columns
  cols = signal<Column[]>([
    { field: 'name', header: 'Nombre', visible: true },
    { field: 'email', header: 'Email', visible: true },
    { field: 'role', header: 'Rol', visible: true },
    { field: 'dni', header: 'DNI', visible: false },
    { field: 'area_id', header: 'Área ID', visible: false },
    { field: 'area', header: 'Área', visible: true },
    { field: 'created_at', header: 'Fecha Creación', visible: true }
  ]);

  // Computed properties
  paginatedUsers = computed(() => {
    return this.filteredUsers().slice(this.first(), this.first() + this.rows());
  });
  currentPage = computed(() => Math.floor(this.first() / this.rows()));
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.rows()));
  visibleColumns = computed(() => this.cols().filter(col => col.visible));

  constructor() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.usersService.getUsers();
      const transformedData = this.transformUserData(data);
      this.users.set(transformedData);
      this.totalRecords.set(transformedData.length);
    } catch (error) {
      this.error.set('Error al cargar los usuarios. Por favor, intenta de nuevo.');
      console.error('Error loading users:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private transformUserData(data: any[]) {
    return data.map(item => ({
      id: item.user_id ?? '',
      email: item.user_data?.email ?? '',
      name: item.user_data?.name ?? 'Sin nombre',
      role: item.role ?? '',
      dni: item.dni ?? '',
      area_id: item.area_id ?? 'Sin área',
      area: item.area_data?.nombre ?? 'Sin área', // Changed to string
      created_at: item.user_data?.created_at 
        ? new Date(item.user_data.created_at).toLocaleDateString('es-ES') 
        : '',
      status: 'active'
    }));
  }

  applyFilters(): UserData[] {
    let filtered = this.users();

    // Search filter
    if (this.searchText()) {
      const searchTerm = this.searchText().toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.dni.toLowerCase().includes(searchTerm)
      );
    }

    // Role filter
    if (this.selectedRoles().length > 0) {
      filtered = filtered.filter(user => 
        this.selectedRoles().includes(user.role)
      );
    }

    // Area filter
    if (this.selectedAreas().length > 0) {
      filtered = filtered.filter(user => 
        this.selectedAreas().includes(parseInt(user.area_id))
      );
    }

    // Sorting
    if (this.sortField() && this.sortOrder()) {
      filtered = [...filtered].sort((a, b) => {
        const valueA = a[this.sortField()!];
        const valueB = b[this.sortField()!];
        
        if (valueA == null) return 1;
        if (valueB == null) return -1;
        if (valueA === valueB) return 0;

        return (valueA > valueB ? 1 : -1) * this.sortOrder()!;
      });
    }

    return filtered;
  }

  toggleSort(field: keyof UserData) {
    if (this.sortField() === field) {
      if (this.sortOrder() === 1) {
        this.sortOrder.set(-1);
      } else if (this.sortOrder() === -1) {
        this.sortField.set(null);
        this.sortOrder.set(null);
      } else {
        this.sortOrder.set(1);
      }
    } else {
      this.sortField.set(field);
      this.sortOrder.set(1);
    }
  }

  toggleActionsMenu(userId: string) {
    this.openActionsMenuId.set(this.openActionsMenuId() === userId ? null : userId);
  }

  toggleColumnSelector() {
    this.showColumnSelector.set(!this.showColumnSelector());
  }

  toggleColumnVisibility(field: keyof UserData) {
    this.cols.update(cols => 
      cols.map(col => 
        col.field === field ? { ...col, visible: !col.visible } : col
      )
    );
  }

  prevPage() {
    if (this.first() > 0) {
      this.first.update(val => val - this.rows());
    }
  }

  nextPage() {
    if (this.first() + this.rows() < this.totalRecords()) {
      this.first.update(val => val + this.rows());
    }
  }

  goToPage(page: number) {
    const newFirst = page * this.rows();
    if (newFirst >= 0 && newFirst < this.totalRecords()) {
      this.first.set(newFirst);
    }
  }

  editUser(user: UserData) {
    console.log('Editar usuario:', user);
    // Implement edit logic here
    this.openActionsMenuId.set(null);
  }

  deleteUser(user: UserData) {
    console.log('Eliminar usuario:', user);
    // Implement delete logic here
    this.openActionsMenuId.set(null);
  }

  getRoleClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      admin: 'bg-red-600/20 text-red-400',
      user: 'bg-green-600/20 text-green-400',
      trabajador: 'bg-blue-600/20 text-blue-400'
    };
    return roleClasses[role] || 'bg-gray-600/20 text-gray-400';
  }

  onAreaChange(event: string) {
    const value = event;
    if (value === '') {
      this.selectedAreas.set([]);
    } else {
      this.selectedAreas.set([parseInt(value)]);
    }
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }
}