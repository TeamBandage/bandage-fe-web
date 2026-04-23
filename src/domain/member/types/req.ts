export interface JoinRequest {
  email: string;
  password: string;
  name: string;
  contact: string;
}

export interface UpdateMeRequest {
  name?: string;
  contact?: string;
}
