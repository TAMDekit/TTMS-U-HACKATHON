import MarketplaceView from "../marketplace";

export default function MarketplacePage() {
  return (
    <>
      <header className="topbar">
        <div className="nav-wrap marketplace-route-header">
          <a className="logo" href="/">
            <span>✦</span> U Ticket 3
          </a>
          <nav className="marketplace-route-nav">
            <a href="/">Events</a>
            <span aria-current="page">Marketplace</span>
          </nav>
        </div>
      </header>
      <main className="page-wrap">
        <MarketplaceView />
      </main>
    </>
  );
}