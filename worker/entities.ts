import { IndexedEntity } from "./core-utils";
import type { Profile, Connection, Endorsement } from "@shared/types";
// Seed data for initial users
const SEED_PROFILES: Profile[] = [
  {
    id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    name: "Alex Cybersmith",
    email: "alex@synapse.io",
    bio: "Full-stack developer specializing in decentralized systems and neural interfaces. Looking for collaborators on a new AI-driven art project.",
    skills: ["React", "Cloudflare Workers", "Rust", "AI", "Durable Objects"],
    image_url: "https://i.pravatar.cc/150?u=alex",
    updated_at: new Date().toISOString(),
  },
  {
    id: "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
    name: "Jasmine 'Jax' Lee",
    email: "jax@synapse.io",
    bio: "Cybersecurity expert and network architect. Passionate about building secure and resilient systems for the new web.",
    skills: ["Cybersecurity", "Networking", "Go", "Cloudflare"],
    image_url: "https://i.pravatar.cc/150?u=jax",
    updated_at: new Date().toISOString(),
  },
  {
    id: "c3d4e5f6-a7b8-9012-3456-7890abcdef01",
    name: "Kenji 'Glitch' Tanaka",
    email: "glitch@synapse.io",
    bio: "Hardware engineer and IoT specialist. I make smart devices smarter and more secure. Let's build the future together.",
    skills: ["IoT", "Hardware", "C++", "Embedded Systems"],
    image_url: "https://i.pravatar.cc/150?u=glitch",
    updated_at: new Date().toISOString(),
  },
];
// PROFILE ENTITY
export class ProfileEntity extends IndexedEntity<Profile> {
  static readonly entityName = "profile";
  static readonly indexName = "profiles";
  static readonly initialState: Profile = { id: "", name: "", email: "", updated_at: "", bio: "", skills: [], image_url: "" };
  static seedData = SEED_PROFILES;
}
// CONNECTION ENTITY
export class ConnectionEntity extends IndexedEntity<Connection> {
  static readonly entityName = "connection";
  static readonly indexName = "connections";
  static readonly initialState: Connection = { id: "", from_user_id: "", to_user_id: "", status: "pending", created_at: "" };
  static keyOf(state: any): string {
    // Use a composite key to ensure uniqueness and allow lookups
    return `${state.from_user_id}:${state.to_user_id}`;
  }
}
// ENDORSEMENT ENTITY
export class EndorsementEntity extends IndexedEntity<Endorsement> {
  static readonly entityName = "endorsement";
  static readonly indexName = "endorsements";
  static readonly initialState: Endorsement = { id: "", endorsed_by_user_id: "", endorsed_user_id: "", skill: "", created_at: "" };
  static keyOf(state: any): string {
    // Composite key to prevent duplicate endorsements
    return `${state.endorsed_by_user_id}:${state.endorsed_user_id}:${state.skill}`;
  }
}