# supbase setup

# Supabase Database Setup for Tool Sharing App

## 1. Create Tables

### Profiles Table

```sql
-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Tools Table

```sql
-- Create tools table
CREATE TABLE tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view available tools" ON tools
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own tools" ON tools
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own tools" ON tools
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own tools" ON tools
  FOR DELETE USING (auth.uid() = owner_id);
```

### Borrow Requests Table

```sql
-- Create borrow_requests table
CREATE TABLE borrow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE borrow_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view requests for their tools" ON borrow_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tools
      WHERE tools.id = borrow_requests.tool_id
      AND tools.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own requests" ON borrow_requests
  FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Users can create borrow requests" ON borrow_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Tool owners can update request status" ON borrow_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tools
      WHERE tools.id = borrow_requests.tool_id
      AND tools.owner_id = auth.uid()
    )
  );
```

## 2. Create Indexes for Performance

```sql
-- Index for faster queries
CREATE INDEX idx_tools_owner_id ON tools(owner_id);
CREATE INDEX idx_tools_category ON tools(category);
CREATE INDEX idx_tools_location ON tools(location);
CREATE INDEX idx_tools_available ON tools(is_available);

CREATE INDEX idx_borrow_requests_tool_id ON borrow_requests(tool_id);
CREATE INDEX idx_borrow_requests_requester_id ON borrow_requests(requester_id);
CREATE INDEX idx_borrow_requests_status ON borrow_requests(status);
```

## 3. Create Functions and Triggers

### Auto-create Profile Trigger

```sql
-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Update Timestamps Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrow_requests_updated_at
  BEFORE UPDATE ON borrow_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Sample Data (Optional)

```sql
-- Insert sample categories for reference
-- Note: Your app uses predefined categories, but this can help with validation

-- Sample tools (replace with actual user UUIDs)
INSERT INTO tools (owner_id, name, description, category, location, is_available) VALUES
('your-user-uuid-here', 'Cordless Drill', 'Makita 18V cordless drill with extra batteries. Great for home projects.', 'Power Tools', 'San Francisco, CA', true),
('your-user-uuid-here', 'Lawn Mower', 'Electric lawn mower, perfect for small to medium yards.', 'Garden Tools', 'Oakland, CA', true),
('your-user-uuid-here', 'Socket Set', 'Complete socket set with ratchets and extensions.', 'Hand Tools', 'Berkeley, CA', true);
```

## 5. Environment Variables

Update your `src/lib/supabase.js` file with your actual Supabase credentials:

```javascript
import {createClient} from "@supabase/supabase-js";

const supabaseUrl = "https://your-project-id.supabase.co";
const supabaseAnonKey = "your-anon-key-here";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 6. Authentication Settings

In your Supabase dashboard, configure:

### Auth Settings

1. **Site URL**: Set to your app's URL (e.g., `http://localhost:3000` for development)
2. **Email Templates**: Customize signup/login email templates if needed
3. **Providers**: Enable email/password authentication

### User Metadata

When users sign up, you'll want to capture additional metadata. Update your registration form to send:

```javascript
const {data, error} = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      location: location,
    },
  },
});
```

## 7. Realtime Subscriptions (Optional)

If you want real-time updates for borrow requests:

```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE borrow_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tools;
```

Then in your React components:

```javascript
// Listen for new borrow requests
useEffect(() => {
  const subscription = supabase
    .channel("borrow_requests")
    .on(
      "postgres_changes",
      {event: "*", schema: "public", table: "borrow_requests"},
      (payload) => {
        // Handle real-time updates
        fetchDashboardData();
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

## 8. Testing the Setup

After running these SQL commands, test your setup by:

1. Creating a new user account
2. Adding a tool
3. Making a borrow request
4. Approving/rejecting requests

Your app should now have a fully functional database backend with proper security policies and relationships.

This setup provides everything you need for your tool sharing app:
Key Features:

User Profiles: Automatically created when users sign up
Tools: Users can add, edit, and manage their tools
Borrow Requests: Complete request system with status tracking
Security: Row Level Security (RLS) ensures users can only access appropriate data
Performance: Proper indexes for fast queries
Real-time: Optional real-time subscriptions for live updates

Next Steps:

Copy the SQL commands into your Supabase SQL editor
Update your supabase.js file with your actual project credentials
Test the authentication flow
Verify that tools and requests work properly

The database structure matches exactly what your React components expect, so everything should work seamlessly once you set up the credentials!
