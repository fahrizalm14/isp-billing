export interface MikroTikConfig {
  host: string;
  username: string;
  password: string;
  port?: number; // Port is optional, default is
  params?: string;
}
