import type { AppHono } from './index';
import { ok, bad, notFound, Env as CoreEnv } from './core-utils';
import { createClient } from '@supabase/supabase-js';
import type { Profile, Connection, Endorsement } from "@shared/types";
/**
 * Extend the default worker `Env` to include the Supabase configuration.
 *
 * The `SUPABASE_URL` and `SUPABASE_ANON_KEY` bindings should be provided via
 * your `wrangler.jsonc` or environment when deploying.  These values are
 * injected at runtime and used to construct a Supabase client for database
 * operations.  See README for deployment instructions.
 */
export type Env = CoreEnv & {
  /** The Supabase project URL */
  SUPABASE_URL: string;
  /** An anonymous API key for the Supabase project */
  SUPABASE_ANON_KEY: string;
};

// Helper to construct a Supabase client per-request.  Supabase clients are
// lightweight and can be instantiated as needed.  We parameterize with
// `<any>` here because the generated `Database` type is not available in this
// project.  If you've generated types via the Supabase CLI you can import
// them and replace `any` with your `Database` type.
function getSupabase(env: Env) {
  return createClient<any>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
export const userRoutes = (app: AppHono): void => {
  // Authentication / user registration
  app.post('/api/auth/login', async (c) => {
    const { email } = await c.req.json<{ email?: string }>();
    if (!email) return bad(c, 'Email is required.');
    const supabase = getSupabase(c.env as Env);
    try {
      // Attempt to fetch the existing profile by email
      const { data: existing, error } = await supabase
        .from<Profile>('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) {
        console.error('Supabase select error:', error.message);
        return bad(c, 'Failed to fetch user');
      }
      let profile = existing as Profile | null;
      // If the user does not exist, insert a new row
      if (!profile) {
        const newUser: Profile = {
          id: crypto.randomUUID(),
          email,
          name: email.split('@')[0],
          bio: '',
          skills: [],
          image_url: `https://i.pravatar.cc/150?u=${email}`,
          updated_at: new Date().toISOString(),
        };
        const { error: insertError } = await supabase
          .from<Profile>('profiles')
          .insert(newUser);
        if (insertError) {
          console.error('Supabase insert error:', insertError.message);
          return bad(c, 'Failed to create user');
        }
        profile = newUser;
      }
      return ok(c, profile);
    } catch (err: any) {
      console.error('Auth login error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Retrieve a user profile by ID
  app.get('/api/auth/me/:id', async (c) => {
    const id = c.req.param('id');
    const supabase = getSupabase(c.env as Env);
    try {
      const { data, error } = await supabase
        .from<Profile>('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        console.error('Supabase select error:', error.message);
        return bad(c, 'Failed to fetch user');
      }
      if (!data) return notFound(c, 'User not found');
      return ok(c, data);
    } catch (err: any) {
      console.error('Auth me error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Create or update a profile
  app.post('/api/profiles', async (c) => {
    const body = await c.req.json<Profile>();
    if (!body.id) return bad(c, 'Profile ID is required');
    const supabase = getSupabase(c.env as Env);
    try {
      // Use upsert so existing rows are updated and new rows are inserted
      const { error } = await supabase
        .from<Profile>('profiles')
        .upsert(body, { onConflict: 'id' });
      if (error) {
        console.error('Supabase upsert error:', error.message);
        return bad(c, 'Failed to save profile');
      }
      return ok(c, body);
    } catch (err: any) {
      console.error('Profile save error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Search for user profiles by name or skills
  app.get('/api/profiles/search', async (c) => {
    const name = c.req.query('name');
    const skillsQuery = c.req.query('skills');
    if (!name && !skillsQuery) {
      return bad(c, 'A search query for name or skills is required.');
    }
    const supabase = getSupabase(c.env as Env);
    try {
      // Fetch all profiles (the dataset is expected to be small).  For large
      // datasets you should push the filtering into SQL using ilike/contains.
      const { data: allProfiles, error } = await supabase
        .from<Profile>('profiles')
        .select('*');
      if (error) {
        console.error('Supabase select error:', error.message);
        return bad(c, 'Failed to fetch profiles');
      }
      let filtered: Profile[] = allProfiles || [];
      if (name) {
        const lower = name.toLowerCase();
        filtered = filtered.filter((p) => p.name?.toLowerCase().includes(lower));
      }
      if (skillsQuery) {
        const skills = skillsQuery.split(',').map((s) => s.trim().toLowerCase());
        filtered = filtered.filter((p) => {
          const userSkills = (p.skills || []).map((s) => s.toLowerCase());
          return skills.every((skill) => userSkills.includes(skill));
        });
      }
      return ok(c, filtered.slice(0, 50));
    } catch (err: any) {
      console.error('Profile search error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Connection routes
  app.post('/api/connections', async (c) => {
    const { from_user_id, to_user_id } = await c.req.json<{ from_user_id?: string; to_user_id?: string }>();
    if (!from_user_id || !to_user_id) {
      return bad(c, 'Both from_user_id and to_user_id are required.');
    }
    const supabase = getSupabase(c.env as Env);
    try {
      const id = `${from_user_id}:${to_user_id}`;
      const newConnection: Connection = {
        id,
        from_user_id,
        to_user_id,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from<Connection>('connections')
        .insert(newConnection);
      if (error) {
        console.error('Supabase insert connection error:', error.message);
        return bad(c, 'Failed to create connection');
      }
      return ok(c, newConnection);
    } catch (err: any) {
      console.error('Create connection error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  app.put('/api/connections/:id', async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json<{ status?: 'accepted' | 'declined' }>();
    if (!status || !['accepted', 'declined'].includes(status)) {
      return bad(c, 'A valid status (accepted or declined) is required.');
    }
    const supabase = getSupabase(c.env as Env);
    try {
      // Check if the connection exists
      const { data: existing, error: selectErr } = await supabase
        .from<Connection>('connections')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (selectErr) {
        console.error('Supabase select connection error:', selectErr.message);
        return bad(c, 'Failed to fetch connection');
      }
      if (!existing) return notFound(c, 'Connection not found.');
      if (status === 'declined') {
        const { error: delErr } = await supabase
          .from<Connection>('connections')
          .delete()
          .eq('id', id);
        if (delErr) {
          console.error('Supabase delete connection error:', delErr.message);
          return bad(c, 'Failed to delete connection');
        }
        return ok(c, { message: 'Connection declined and removed.' });
      }
      const { error: updateErr } = await supabase
        .from<Connection>('connections')
        .update({ status })
        .eq('id', id);
      if (updateErr) {
        console.error('Supabase update connection error:', updateErr.message);
        return bad(c, 'Failed to update connection');
      }
      return ok(c, { ...existing, status });
    } catch (err: any) {
      console.error('Update connection error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Endorsement routes
  app.post('/api/endorsements', async (c) => {
    const { endorsed_user_id, endorsed_by_user_id, skill } = await c.req.json<{ endorsed_user_id?: string; endorsed_by_user_id?: string; skill?: string }>();
    if (!endorsed_user_id || !endorsed_by_user_id || !skill) {
      return bad(c, 'endorsed_user_id, endorsed_by_user_id, and skill are required.');
    }
    const supabase = getSupabase(c.env as Env);
    try {
      const newEndorsement: Endorsement = {
        id: crypto.randomUUID(),
        endorsed_user_id,
        endorsed_by_user_id,
        skill,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from<Endorsement>('endorsements')
        .insert(newEndorsement);
      if (error) {
        console.error('Supabase insert endorsement error:', error.message);
        return bad(c, 'Failed to create endorsement');
      }
      return ok(c, newEndorsement);
    } catch (err: any) {
      console.error('Create endorsement error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Leaderboard routes
  app.get('/api/leaderboard', async (c) => {
    const type = c.req.query('type');
    const supabase = getSupabase(c.env as Env);
    try {
      if (type === 'skills') {
        // Fetch all endorsements and aggregate counts by skill
        const { data: allEndorsements, error } = await supabase
          .from<Endorsement>('endorsements')
          .select('*');
        if (error) {
          console.error('Supabase select endorsements error:', error.message);
          return bad(c, 'Failed to fetch endorsements');
        }
        const skillCounts = (allEndorsements || []).reduce((acc: Record<string, number>, e) => {
          acc[e.skill] = (acc[e.skill] || 0) + 1;
          return acc;
        }, {});
        const sortedSkills = Object.entries(skillCounts)
          .map(([skill, count]) => ({ skill, endorsement_count: count }))
          .sort((a, b) => b.endorsement_count - a.endorsement_count);
        return ok(c, sortedSkills);
      }
      if (type === 'connectors') {
        // Fetch all connections and profiles
        const [{ data: allConnections, error: connErr }, { data: allProfiles, error: profErr }] = await Promise.all([
          supabase.from<Connection>('connections').select('*'),
          supabase.from<Profile>('profiles').select('*'),
        ]);
        if (connErr) {
          console.error('Supabase select connections error:', connErr.message);
          return bad(c, 'Failed to fetch connections');
        }
        if (profErr) {
          console.error('Supabase select profiles error:', profErr.message);
          return bad(c, 'Failed to fetch profiles');
        }
        const profilesById = new Map((allProfiles || []).map((p) => [p.id, p]));
        const connectionCounts: Record<string, number> = {};
        (allConnections || []).forEach((conn) => {
          if (conn.status === 'accepted') {
            connectionCounts[conn.from_user_id] = (connectionCounts[conn.from_user_id] || 0) + 1;
            connectionCounts[conn.to_user_id] = (connectionCounts[conn.to_user_id] || 0) + 1;
          }
        });
        const sortedConnectors = Object.entries(connectionCounts)
          .map(([id, count]) => {
            const profile = profilesById.get(id);
            return {
              id,
              name: profile?.name || 'Unknown',
              email: profile?.email || 'Unknown',
              connection_count: count,
            };
          })
          .sort((a, b) => b.connection_count - a.connection_count);
        return ok(c, sortedConnectors);
      }
      return bad(c, 'Invalid leaderboard type specified.');
    } catch (err: any) {
      console.error('Leaderboard error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Network graph route
  app.get('/api/network-graph', async (c) => {
    const supabase = getSupabase(c.env as Env);
    try {
      const [{ data: profiles, error: profErr }, { data: connections, error: connErr }] = await Promise.all([
        supabase.from<Profile>('profiles').select('*'),
        supabase.from<Connection>('connections').select('*'),
      ]);
      if (profErr) {
        console.error('Supabase select profiles error:', profErr.message);
        return bad(c, 'Failed to fetch profiles');
      }
      if (connErr) {
        console.error('Supabase select connections error:', connErr.message);
        return bad(c, 'Failed to fetch connections');
      }
      return ok(c, {
        profiles: profiles || [],
        connections: (connections || []).filter((conn) => conn.status === 'accepted'),
      });
    } catch (err: any) {
      console.error('Network graph error:', err);
      return bad(c, 'Internal Server Error');
    }
  });
  // Seed data (for development)
  app.post('/api/seed', async (c) => {
    // No-op for Supabase backend; seeding must be performed via SQL or the Supabase dashboard.
    return ok(c, { message: 'Seeding not supported on Supabase backend.' });
  });
}