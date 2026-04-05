import { Navigate } from "react-router-dom";

/** Old URL; bookmarks still work — main UI lives on the Dashboard tab. */
export default function Businesses() {
  return <Navigate to="/app?tab=businesses" replace />;
}
