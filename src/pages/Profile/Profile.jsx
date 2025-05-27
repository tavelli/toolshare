import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import {supabase} from "../../lib/supabase";
import ToolCard from "../../components/ToolCard/ToolCard";
import styles from "./Profile.module.css";

const Profile = () => {
  const {id} = useParams(); // user id from route
  const {user} = useAuth();
  const [profile, setProfile] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({full_name: "", location: ""});
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    fetchProfile();
  }, [id, user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Get profile
      let profileId = id;
      const {data: profileData, error: profileError} = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (profileError) throw profileError;
      setProfile(profileData);
      setEditForm({
        full_name: profileData.full_name || "",
        location: profileData.location || "",
      });
      // Get tools for this user
      const {data: toolsData, error: toolsError} = await supabase
        .from("tools")
        .select("*")
        .eq("owner_id", profileId)
        .order("created_at", {ascending: false});
      if (toolsError) throw toolsError;
      setTools(toolsData || []);
    } catch (error) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const {name, value} = e.target;
    setEditForm((prev) => ({...prev, [name]: value}));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const {error} = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          location: editForm.location,
        })
        .eq("id", user.id);
      if (error) throw error;
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }
  if (!profile) {
    return <div className={styles.notFound}>Profile not found.</div>;
  }

  return (
    <div className={styles.profilePage}>
      <div className="container">
        <div className={styles.profileHeader}>
          <h1>Profile</h1>
          {isOwnProfile && !editMode && (
            <button
              className={styles.editButton}
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
        <div className={styles.profileInfo}>
          {editMode ? (
            <form onSubmit={handleEditSubmit} className={styles.editForm}>
              {editError && <div className={styles.error}>{editError}</div>}
              <div className={styles.field}>
                <label htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={editForm.full_name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={editForm.location}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setEditMode(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className={styles.profileField}>
                <strong>Name:</strong> {profile.full_name}
              </div>
              <div className={styles.profileField}>
                <strong>Location:</strong> {profile.location}
              </div>
            </>
          )}
        </div>
        <div className={styles.toolsSection}>
          <h2>Tools Shared by {profile.full_name || "User"}</h2>
          <div className={styles.toolsGrid}>
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
            {tools.length === 0 && (
              <p className={styles.emptyState}>No tools shared yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
