/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./types/greenhouse').PublicUser | null;
    token: string | null;
  }
}
