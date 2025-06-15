export interface Ticket {
    id:               string;
    user_id:          string;
    dni:              string;
    nombre_usuario:   string;
    asunto:           string;
    descripcion:      string;
    status:           string;
    priority:         string;
    visto:            boolean;
    created_at:       Date;
    responded_at:     string | null;
    proyecto_id:      AID | null;
    tipo_problema_id: AID;
    area_destino:     AID;
    area_origen:      AID;
    ticket_responses: TicketResponse[];
    image_urls:       string[];
}

export interface CreateTicket {
    user_id:          string;
    dni:              string;
    nombre_usuario:   string;
    asunto:           string;
    descripcion:      string;
    priority:         string;
    proyecto_id?:      number;
    tipo_problema_id: number;
    area_destino?:     number;
    area_origen?:      number;
    image_urls?:      string[];
}

export interface AID {
    id:     number;
    nombre: string;
}

export interface TicketResponse {
    id:         string;
    mensaje:    string;
    user_id:    string;
    ticket_id:  string;
    created_at: Date;
}