function Admin() {
  return (
    <div className="page">
      <div className="container">
        <div className="page-title">
          <h1>Admin Dashboard</h1>
          <p>Manage the TravelEase platform.</p>
        </div>

        <div className="cards">
          <div className="card">
            <h3>👥 Users</h3>
            <p>Manage registered users.</p>
          </div>

          <div className="card">
            <h3>🎫 Bookings</h3>
            <p>Manage travel bookings.</p>
          </div>

          <div className="card">
            <h3>💳 Payments</h3>
            <p>View payment information.</p>
          </div>

          <div className="card">
            <h3>📊 Analytics</h3>
            <p>View platform statistics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;