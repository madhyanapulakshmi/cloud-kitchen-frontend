import "./Pages.css";

function Profile({ user }) {
  return (
    <div className="page-container">
      <div className="page-header">
        <span className="small-heading">
          ACCOUNT
        </span>

        <h1>My Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="profile-info">
          <h2>{user?.name}</h2>

          <p>{user?.email}</p>

          <span className="profile-role">
            {user?.role}
          </span>
        </div>
      </div>

      <div className="profile-info-grid">
        <div>
          <span>Name</span>
          <strong>{user?.name}</strong>
        </div>

        <div>
          <span>Email</span>
          <strong>{user?.email}</strong>
        </div>

        <div>
          <span>Account Type</span>
          <strong>{user?.role}</strong>
        </div>

        <div>
          <span>Account Status</span>
          <strong className="active-text">
            Active
          </strong>
        </div>
      </div>
    </div>
  );
}

export default Profile;

