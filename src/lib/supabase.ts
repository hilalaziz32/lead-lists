import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type Company = {
  id: string;
  company_name: string | null;
  domain: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employee_count: number | null;
  phone: string | null;
  description: string | null;
  founded_year: number | null;
  revenue: string | null;
  source: string | null;
  client: string | null;
  niche: string | null;
  tags: string[] | null;
  last_updated: string | null;
  created_at: string | null;
  domain_status: string | null;
  mx_provider: string | null;
  security_gateway: string | null;
  quality_tier: string | null;
  keywords: string[] | null;
  technologies: string[] | null;
  custom_data: Record<string, unknown> | null;
  pushed_to_clay: boolean | null;
  pushed_to_clay_at: string | null;
};

export type Person = {
  id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  linkedin_username: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  company_name: string | null;
  domain: string | null;
  source: string | null;
  source_id: string | null;
  tags: string[] | null;
  pushed_to_emailbison: boolean | null;
  pushed_to_emailbison_at: string | null;
  pushed_to_ghl: boolean | null;
  pushed_to_ghl_at: string | null;
  email_status: string | null;
  phone_type: string | null;
  custom_data: Record<string, unknown> | null;
  last_updated: string | null;
  created_at: string | null;
  companies?: { id: string; company_name: string | null; domain: string | null } | null;
};
