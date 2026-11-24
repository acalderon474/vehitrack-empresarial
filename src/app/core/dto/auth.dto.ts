
export interface CredencialesLoginDto {
    email: string;
    password: string;
    tenant_id: string;
}

export interface DatosSesionDto {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    refresh_expires_in?: number;
    user?: {
        id: string;
        tenant_id: string;
    };
}

export interface RespuestaAuthDto<T> {
    errors: Array<{
        code: string;
        message: string;
    }>;
    data: T;
}
