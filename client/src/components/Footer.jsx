export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>© {new Date().getFullYear()} ShopSphere. A full stack MERN portfolio project.</p>
        <p className="muted small">Payments run in Razorpay test mode. No real money is charged.</p>
      </div>
    </footer>
  );
}
