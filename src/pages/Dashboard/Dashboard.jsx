import React, {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {supabase} from "../../lib/supabase";
import {useAuth} from "../../contexts/AuthContext";
import styles from "./Dashboard.module.css";
import Compressor from "compressorjs";
import Modal from "../../components/Modal/Modal";

const Dashboard = () => {
  const {user} = useAuth();
  const [myTools, setMyTools] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTool, setEditingTool] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    image_url: "",
    is_available: true,
  });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's tools
      const {data: toolsData, error: toolsError} = await supabase
        .from("tools")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", {ascending: false});
      if (toolsError) throw toolsError;
      setMyTools(toolsData || []);

      // Fetch borrow requests for user's tools
      const {data: requestsData, error: requestsError} = await supabase
        .from("borrow_requests")
        .select(
          `
          *,
          tools (name, category),
          profiles (full_name, location)
        `
        )
        .in("tool_id", toolsData?.map((tool) => tool.id) || [])
        .order("created_at", {ascending: false});
      if (requestsError) throw requestsError;
      setBorrowRequests(requestsData || []);

      // Fetch user's own requests
      const {data: myRequestsData, error: myRequestsError} = await supabase
        .from("borrow_requests")
        .select(
          `
          *,
          tools (name, category, owner_id),
          profiles (full_name, location)
        `
        )
        .eq("requester_id", user.id)
        .order("created_at", {ascending: false});
      if (myRequestsError) throw myRequestsError;
      setMyRequests(myRequestsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, status) => {
    try {
      const {error} = await supabase
        .from("borrow_requests")
        .update({status})
        .eq("id", requestId);
      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  const startEditTool = (tool) => {
    setEditingTool(tool);
    setEditForm({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      image_url: tool.image_url,
      is_available: tool.is_available,
    });
    setEditError("");
  };

  const handleEditChange = (e) => {
    const {name, value, type, checked} = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditUploading(true);
    setEditError("");
    new Compressor(file, {
      quality: 0.6,
      maxWidth: 1200,
      success: async (compressedFile) => {
        try {
          const fileExt = file.name.split(".").pop();
          const fileName = `${user.id}_${Date.now()}.${fileExt}`;
          const {error} = await supabase.storage
            .from("tool-images")
            .upload(fileName, compressedFile);
          if (error) throw error;
          const {data: publicUrlData} = supabase.storage
            .from("tool-images")
            .getPublicUrl(fileName);
          setEditForm((prev) => ({
            ...prev,
            image_url: publicUrlData.publicUrl,
          }));
        } catch (error) {
          setEditError("Image upload failed. " + error.message);
        } finally {
          setEditUploading(false);
        }
      },
      error: (err) => {
        setEditError("Image compression failed. " + err.message);
        setEditUploading(false);
      },
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const {error} = await supabase
        .from("tools")
        .update({
          ...editForm,
        })
        .eq("id", editingTool.id);
      if (error) throw error;
      setEditingTool(null);
      fetchDashboardData();
    } catch (error) {
      setEditError(error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTool = async (toolId) => {
    if (!window.confirm("Are you sure you want to delete this tool?")) return;
    setDeleteLoading(true);
    try {
      const {error} = await supabase.from("tools").delete().eq("id", toolId);
      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      alert("Failed to delete tool: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className="container">
        <div className={styles.header}>
          <h1>Dashboard</h1>
          <Link to="/add-tool" className={styles.addButton}>
            + Add New Tool
          </Link>
        </div>
        <div className={styles.sections}>
          {/* My Tools */}
          <section className={styles.section}>
            <h2>My Tools ({myTools.length})</h2>
            <div className={styles.toolsGrid}>
              {myTools.map((tool) => (
                <div key={tool.id} className={styles.toolCard}>
                  <div className={styles.toolImage}>
                    {tool.image_url ? (
                      <img src={tool.image_url} alt={tool.name} />
                    ) : (
                      <div className={styles.placeholder}>🔧</div>
                    )}
                  </div>
                  <div className={styles.toolInfo}>
                    <h3>{tool.name}</h3>
                    <p className={styles.category}>{tool.category}</p>
                    <p className={styles.status}>
                      Status:{" "}
                      {tool.is_available ? "Available" : "Not Available"}
                    </p>
                  </div>
                  <div className={styles.toolActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => startEditTool(tool)}
                      disabled={editLoading || deleteLoading}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteTool(tool.id)}
                      disabled={editLoading || deleteLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {myTools.length === 0 && (
                <p className={styles.emptyState}>
                  You haven't added any tools yet.{" "}
                  <Link to="/add-tool">Add your first tool</Link>
                </p>
              )}
            </div>
            {editingTool && (
              <Modal open={!!editingTool} onClose={() => setEditingTool(null)}>
                <h2>Edit Tool</h2>
                <form onSubmit={handleEditSubmit} className={styles.editForm}>
                  {editError && <div className={styles.error}>{editError}</div>}
                  <div className={styles.field}>
                    <label htmlFor="edit_name">Tool Name *</label>
                    <input
                      id="edit_name"
                      name="name"
                      type="text"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="edit_category">Category *</label>
                    <input
                      id="edit_category"
                      name="category"
                      type="text"
                      value={editForm.category}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="edit_image">Image</label>
                    <input
                      id="edit_image"
                      name="edit_image"
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      disabled={editUploading}
                    />
                    {editUploading && <span>Uploading...</span>}
                    {editForm.image_url && (
                      <img
                        src={editForm.image_url}
                        alt="Preview"
                        style={{marginTop: 8, maxWidth: 200, borderRadius: 8}}
                      />
                    )}
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="edit_description">Description *</label>
                    <textarea
                      id="edit_description"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      required
                      rows={3}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>
                      <input
                        type="checkbox"
                        name="is_available"
                        checked={editForm.is_available}
                        onChange={handleEditChange}
                      />
                      Available for borrowing
                    </label>
                  </div>
                  <div className={styles.editActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setEditingTool(null)}
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
              </Modal>
            )}
          </section>

          {/* Incoming Requests */}
          <section className={styles.section}>
            <h2>Requests for My Tools ({borrowRequests.length})</h2>
            <div className={styles.requestsList}>
              {borrowRequests.map((request) => (
                <div key={request.id} className={styles.requestCard}>
                  <div className={styles.requestInfo}>
                    <h3>{request.profiles?.full_name}</h3>
                    <p>
                      wants to borrow <strong>{request.tools?.name}</strong>
                    </p>
                    <p className={styles.requestDate}>
                      From {new Date(request.start_date).toLocaleDateString()}{" "}
                      to {new Date(request.end_date).toLocaleDateString()}
                    </p>
                    {request.message && (
                      <p className={styles.message}>"{request.message}"</p>
                    )}
                    <p className={styles.location}>
                      📍 {request.profiles?.location}
                    </p>
                  </div>
                  <div className={styles.requestActions}>
                    <span
                      className={`${styles.status} ${styles[request.status]}`}
                    >
                      {request.status}
                    </span>
                    {request.status === "pending" && (
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() =>
                            handleRequestResponse(request.id, "approved")
                          }
                          className={styles.approveButton}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleRequestResponse(request.id, "rejected")
                          }
                          className={styles.rejectButton}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {borrowRequests.length === 0 && (
                <p className={styles.emptyState}>
                  No requests for your tools yet.
                </p>
              )}
            </div>
          </section>

          {/* My Requests */}
          <section className={styles.section}>
            <h2>My Borrow Requests ({myRequests.length})</h2>
            <div className={styles.requestsList}>
              {myRequests.map((request) => (
                <div key={request.id} className={styles.requestCard}>
                  <div className={styles.requestInfo}>
                    <h3>{request.tools?.name}</h3>
                    <p className={styles.requestDate}>
                      From {new Date(request.start_date).toLocaleDateString()}
                      to {new Date(request.end_date).toLocaleDateString()}
                    </p>
                    {request.message && (
                      <p className={styles.message}>"{request.message}"</p>
                    )}
                  </div>
                  <div className={styles.requestActions}>
                    <span
                      className={`${styles.status} ${styles[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
              {myRequests.length === 0 && (
                <p className={styles.emptyState}>
                  You haven't made any borrow requests yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
