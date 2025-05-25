import {createClient} from "@supabase/supabase-js";

const supabaseUrl = "https://dmekchcdbiorzdkwoywf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZWtjaGNkYmlvcnpka3dveXdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMjEzODAsImV4cCI6MjA2MzY5NzM4MH0.litolzPGahFymNK5-rvPjiRon8WYd3U2bCdTbD_M-dQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
