import { inject, Injectable } from "@angular/core";
import { SupabaseService } from "./supabase.service";

export interface UserResponse {
    user_id: string
    role: string
    dni: string
    area_id: number
    user_data: UserData
    area_data: AreaData
}

export interface UserData {
    email: string
    name: string
    avatar_url: string
    created_at: string
}

export interface AreaData {
    nombre: string
}

@Injectable({
    providedIn: 'root',
})
export class UsersService {
    private supabaseService = inject(SupabaseService);

    async getUsers() {
        const { data, error } = await this.supabaseService.supabase
            .rpc('get_user_roles_with_auth');

        if (error) throw error;
        return data as UserResponse[];
    }

}